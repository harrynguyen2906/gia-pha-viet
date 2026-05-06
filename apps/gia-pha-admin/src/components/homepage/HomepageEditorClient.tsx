"use client";

import { clampSceneFrame, type HomepageLayerSnapshot } from "@gia-pha/homepage-scene";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HomepageAssetDto, HomepageConfigDto } from "@/types/homepage";

interface DragState {
  layerId: string;
  startX: number;
  startY: number;
  startFrame: HomepageLayerSnapshot["frame"];
}

const OVERLAY_DRAG_MIME = "application/x-homepage-overlay-asset-id";

const defaultLink = {
  href: "/",
  tooltip: "Đi đến liên kết",
  ariaLabel: "Homepage overlay link",
  external: false,
};

function makeLayerFromAsset(
  asset: HomepageAssetDto,
  backgroundWidth: number,
  backgroundHeight: number,
  nextZIndex: number
): HomepageLayerSnapshot {
  const maxWidth = Math.max(100, backgroundWidth * 0.35);
  const initialScale = asset.width > maxWidth ? maxWidth / asset.width : 1;
  const width = Math.max(80, Math.round(asset.width * initialScale));
  const height = Math.max(80, Math.round(asset.height * initialScale));

  return {
    id: crypto.randomUUID(),
    assetId: asset.id,
    name: asset.fileName,
    imageUrl: asset.publicUrl,
    naturalWidth: asset.width,
    naturalHeight: asset.height,
    frame: {
      x: Math.round((backgroundWidth - width) / 2),
      y: Math.round((backgroundHeight - height) / 2),
      width,
      height,
    },
    zIndex: nextZIndex,
    opacity: 1,
    blendMode: "normal",
    visible: true,
    locked: false,
    link: defaultLink,
  };
}

async function readImageInfo(file: File) {
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  let hasAlpha = false;

  if (file.type === "image/png" || file.type === "image/webp") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, width, height).data;
      for (let i = 3; i < imageData.length; i += 16) {
        if (imageData[i] < 250) {
          hasAlpha = true;
          break;
        }
      }
    }
  }

  bitmap.close();
  return { width, height, hasAlpha };
}

export default function HomepageEditorClient() {
  const [assets, setAssets] = useState<HomepageAssetDto[]>([]);
  const [configs, setConfigs] = useState<HomepageConfigDto[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<"BACKGROUND" | "OVERLAY" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(0);

  const backgroundInputRef = useRef<HTMLInputElement | null>(null);
  const overlayInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);

  const activeConfig = useMemo(
    () => configs.find((config) => config.id === activeConfigId) ?? null,
    [configs, activeConfigId]
  );

  const selectedLayer = useMemo(
    () => activeConfig?.layers.find((layer) => layer.id === selectedLayerId) ?? null,
    [activeConfig, selectedLayerId]
  );

  const overlayAssets = useMemo(() => assets.filter((asset) => asset.kind === "OVERLAY"), [assets]);
  const backgroundAssets = useMemo(
    () => assets.filter((asset) => asset.kind === "BACKGROUND"),
    [assets]
  );

  const sceneScale =
    activeConfig && activeConfig.backgroundWidth > 0
      ? canvasWidth / activeConfig.backgroundWidth
      : 1;

  const activeConfigIsDraft = activeConfig?.status === "DRAFT";

  const patchActiveConfig = useCallback(
    (patch: (current: HomepageConfigDto) => HomepageConfigDto) => {
      if (!activeConfigId || !activeConfigIsDraft) return;
      setConfigs((current) =>
        current.map((config) => (config.id === activeConfigId ? patch(config) : config))
      );
      setIsDirty(true);
    },
    [activeConfigId, activeConfigIsDraft]
  );

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assetsRes, configsRes] = await Promise.all([
        fetch("/api/admin/homepage/assets", { cache: "no-store" }),
        fetch("/api/admin/homepage/configs", { cache: "no-store" }),
      ]);

      const [assetsJson, configsJson] = await Promise.all([assetsRes.json(), configsRes.json()]);

      if (!assetsRes.ok) {
        throw new Error(assetsJson.error ?? "Failed to load assets");
      }
      if (!configsRes.ok) {
        throw new Error(configsJson.error ?? "Failed to load configs");
      }

      setAssets(assetsJson);
      setConfigs(configsJson);

      if (configsJson.length > 0) {
        const firstDraft = configsJson.find(
          (config: HomepageConfigDto) => config.status === "DRAFT"
        );
        const nextActive = firstDraft?.id ?? configsJson[0].id;
        setActiveConfigId(nextActive);
        setSelectedLayerId(null);
      } else {
        setActiveConfigId(null);
      }
      setIsDirty(false);
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Failed to load homepage editor data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const update = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCanvasWidth(rect.width);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [activeConfig?.backgroundWidth, activeConfig?.backgroundHeight]);

  useEffect(() => {
    if (!dragState || !activeConfig || !activeConfigIsDraft) return;

    const onMove = (event: PointerEvent) => {
      const dx = (event.clientX - dragState.startX) / Math.max(sceneScale, 0.0001);
      const dy = (event.clientY - dragState.startY) / Math.max(sceneScale, 0.0001);
      const nextFrame = clampSceneFrame(
        {
          ...dragState.startFrame,
          x: dragState.startFrame.x + dx,
          y: dragState.startFrame.y + dy,
        },
        activeConfig.backgroundWidth,
        activeConfig.backgroundHeight
      );

      patchActiveConfig((current) => ({
        ...current,
        layers: current.layers.map((layer) =>
          layer.id === dragState.layerId ? { ...layer, frame: nextFrame } : layer
        ),
      }));
    };

    const onUp = () => setDragState(null);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [activeConfig, activeConfigIsDraft, dragState, patchActiveConfig, sceneScale]);

  const createDraftFromConfig = useCallback(
    async (sourceConfigId?: string) => {
      try {
        const response = await fetch("/api/admin/homepage/configs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sourceConfigId ? { sourceConfigId } : {}),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? "Unable to create draft");
        }
        await loadAll();
        if (json?.id) {
          setActiveConfigId(json.id);
        }
        setMessage("Đã tạo draft mới.");
      } catch (error) {
        console.error(error);
        setMessage(error instanceof Error ? error.message : "Unable to create draft");
      }
    },
    [loadAll]
  );

  const createDraftWithBackground = useCallback(
    async (asset: HomepageAssetDto) => {
      try {
        const response = await fetch("/api/admin/homepage/configs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Draft ${new Date().toISOString()}`,
            backgroundAssetId: asset.id,
            backgroundWidth: asset.width,
            backgroundHeight: asset.height,
            layers: [],
          }),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? "Unable to create draft");
        }
        await loadAll();
        if (json?.id) {
          setActiveConfigId(json.id);
        }
        setMessage(`Đã tạo draft với background ${asset.fileName}.`);
      } catch (error) {
        console.error(error);
        setMessage(error instanceof Error ? error.message : "Unable to create draft");
      }
    },
    [loadAll]
  );

  const uploadAsset = useCallback(
    async (kind: "BACKGROUND" | "OVERLAY", file: File) => {
      setUploadingKind(kind);
      try {
        const imageInfo = await readImageInfo(file);
        const formData = new FormData();
        formData.append("kind", kind);
        formData.append("file", file);
        formData.append("width", String(imageInfo.width));
        formData.append("height", String(imageInfo.height));
        formData.append("hasAlpha", String(imageInfo.hasAlpha));

        const response = await fetch("/api/admin/homepage/assets", {
          method: "POST",
          body: formData,
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? "Upload failed");
        }
        setMessage(`Đã upload ${file.name}`);
        await loadAll();
      } catch (error) {
        console.error(error);
        setMessage(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploadingKind(null);
      }
    },
    [loadAll]
  );

  const saveDraft = useCallback(async () => {
    if (!activeConfig || !activeConfigIsDraft) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/homepage/configs/${activeConfig.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeConfig.name,
          backgroundAssetId: activeConfig.backgroundAssetId,
          backgroundWidth: activeConfig.backgroundWidth,
          backgroundHeight: activeConfig.backgroundHeight,
          layers: activeConfig.layers,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to save draft");
      }

      setConfigs((current) =>
        current.map((config) => (config.id === activeConfig.id ? json : config))
      );
      setIsDirty(false);
      setMessage("Đã lưu draft.");
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  }, [activeConfig, activeConfigIsDraft]);

  const publishDraft = useCallback(async () => {
    if (!activeConfig || !activeConfigIsDraft) return;
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/admin/homepage/configs/${activeConfig.id}/publish`, {
        method: "POST",
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to publish");
      }
      setMessage("Đã publish homepage.");
      setIsDirty(false);
      await loadAll();
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  }, [activeConfig, activeConfigIsDraft, loadAll]);

  const restoreConfig = useCallback(
    async (configId: string) => {
      try {
        const response = await fetch(`/api/admin/homepage/configs/${configId}/restore`, {
          method: "POST",
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? "Failed to restore config");
        }
        setMessage("Đã restore thành draft mới.");
        await loadAll();
        if (json?.id) {
          setActiveConfigId(json.id);
        }
      } catch (error) {
        console.error(error);
        setMessage(error instanceof Error ? error.message : "Failed to restore config");
      }
    },
    [loadAll]
  );

  const setBackgroundAsset = useCallback(
    (asset: HomepageAssetDto) => {
      if (!activeConfig) {
        void createDraftWithBackground(asset);
        return;
      }
      if (!activeConfigIsDraft) {
        setMessage("Chỉ draft mới có thể chỉnh sửa. Hãy tạo draft mới trước.");
        return;
      }
      patchActiveConfig((current) => ({
        ...current,
        backgroundAssetId: asset.id,
        backgroundUrl: asset.publicUrl,
        backgroundWidth: asset.width,
        backgroundHeight: asset.height,
      }));
      setMessage(`Đã chọn background: ${asset.fileName}`);
    },
    [activeConfig, activeConfigIsDraft, createDraftWithBackground, patchActiveConfig]
  );

  const addOverlayToScene = useCallback(
    (asset: HomepageAssetDto, dropAt?: { sceneX: number; sceneY: number }) => {
      if (!activeConfig) return;
      if (!activeConfigIsDraft) {
        setMessage("Chỉ draft mới có thể chỉnh sửa. Hãy tạo draft mới trước.");
        return;
      }
      const maxZ = activeConfig.layers.reduce((max, layer) => Math.max(max, layer.zIndex), 0);
      const layer = makeLayerFromAsset(
        asset,
        activeConfig.backgroundWidth,
        activeConfig.backgroundHeight,
        maxZ + 1
      );
      const nextLayer = dropAt
        ? {
            ...layer,
            frame: clampSceneFrame(
              {
                ...layer.frame,
                x: dropAt.sceneX - layer.frame.width / 2,
                y: dropAt.sceneY - layer.frame.height / 2,
              },
              activeConfig.backgroundWidth,
              activeConfig.backgroundHeight
            ),
          }
        : layer;
      patchActiveConfig((current) => ({
        ...current,
        layers: [...current.layers, nextLayer],
      }));
      setSelectedLayerId(nextLayer.id);
    },
    [activeConfig, activeConfigIsDraft, patchActiveConfig]
  );

  const sortedLayers = useMemo(
    () => (activeConfig ? [...activeConfig.layers].sort((a, b) => a.zIndex - b.zIndex) : []),
    [activeConfig]
  );

  if (isLoading) {
    return <div className="p-8 text-secondary">Loading homepage editor...</div>;
  }

  if (viewportWidth > 0 && viewportWidth < 1280) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-[#5a403c]/40 bg-[#2b1818] p-6 text-[#e3beb8]">
          Homepage editor yêu cầu màn hình desktop (&gt;= 1280px).
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="rounded-xl border border-[#5a403c]/30 bg-[#2b1818] p-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#ffdea5]">Homepage Editor</h1>
          <p className="text-sm text-[#b79b95]">
            Upload PNG layers, drag to place, save draft, then publish.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void createDraftFromConfig(activeConfig?.id)}
            className="px-3 py-2 rounded-md border border-[#5a403c] hover:bg-[#472e2e] text-sm"
          >
            New Draft
          </button>
          <button
            type="button"
            disabled={!activeConfigIsDraft || !isDirty || isSaving}
            onClick={() => void saveDraft()}
            className="px-3 py-2 rounded-md bg-primary-container text-secondary disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            disabled={!activeConfigIsDraft || isPublishing}
            onClick={() => void publishDraft()}
            className="px-3 py-2 rounded-md bg-[#d8a454] text-[#210e0e] disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-md border border-[#5a403c]/40 bg-[#210e0e] px-3 py-2 text-sm text-[#e3beb8]">
          {message}
        </div>
      ) : null}

      <div className="flex-1 min-h-0 grid grid-cols-[280px_1fr_320px] gap-4">
        <aside className="rounded-xl border border-[#5a403c]/30 bg-[#2b1818] p-3 overflow-auto">
          <h2 className="text-sm uppercase tracking-wider text-[#ffdea5] mb-2">Configs</h2>
          <div className="space-y-2">
            {configs.map((config) => (
              <button
                key={config.id}
                type="button"
                onClick={() => {
                  setActiveConfigId(config.id);
                  setSelectedLayerId(null);
                  setIsDirty(false);
                }}
                className={`w-full text-left rounded-md px-3 py-2 border text-sm ${
                  activeConfigId === config.id
                    ? "border-[#d8a454] bg-[#472e2e]"
                    : "border-[#5a403c]/40 hover:bg-[#3a2424]"
                }`}
              >
                <div className="font-medium">{config.name}</div>
                <div className="text-xs text-[#b79b95]">
                  {config.status}
                  {config.version ? ` • v${config.version}` : ""}
                </div>
                {config.status !== "DRAFT" ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void restoreConfig(config.id);
                    }}
                    className="mt-2 text-xs px-2 py-1 rounded border border-[#5a403c] hover:bg-[#472e2e]"
                  >
                    Restore to Draft
                  </button>
                ) : null}
              </button>
            ))}
          </div>
        </aside>

        <main className="rounded-xl border border-[#5a403c]/30 bg-[#2b1818] p-3 overflow-auto">
          {!activeConfig ? (
            <div className="h-full grid place-items-center text-[#b79b95]">
              <div className="text-center">
                <p className="mb-2">No homepage config yet.</p>
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-[#5a403c] hover:bg-[#472e2e]"
                  onClick={() => void createDraftFromConfig()}
                >
                  Create Draft from Published
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-[#b79b95]">
                Scene size: {activeConfig.backgroundWidth} x {activeConfig.backgroundHeight}
                {!activeConfigIsDraft ? " • Read-only (not a draft)" : ""}
              </div>
              <div
                ref={canvasRef}
                className="relative w-full bg-[#1a1a1a] border border-[#5a403c]/40 overflow-hidden"
                style={{
                  aspectRatio: `${activeConfig.backgroundWidth} / ${activeConfig.backgroundHeight}`,
                }}
                onPointerDown={() => setSelectedLayerId(null)}
                onDragOver={(event) => {
                  if (!activeConfigIsDraft) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                }}
                onDrop={(event) => {
                  if (!activeConfigIsDraft) return;
                  const assetId = event.dataTransfer.getData(OVERLAY_DRAG_MIME);
                  if (!assetId) return;
                  event.preventDefault();
                  const asset = overlayAssets.find((item) => item.id === assetId);
                  if (!asset) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const sceneX = (event.clientX - rect.left) / Math.max(sceneScale, 0.0001);
                  const sceneY = (event.clientY - rect.top) / Math.max(sceneScale, 0.0001);
                  addOverlayToScene(asset, { sceneX, sceneY });
                }}
              >
                <img
                  src={activeConfig.backgroundUrl}
                  alt="Homepage background"
                  className="absolute inset-0 w-full h-full object-fill"
                  draggable={false}
                />

                {sortedLayers.map((layer) => {
                  const left = layer.frame.x * sceneScale;
                  const top = layer.frame.y * sceneScale;
                  const width = layer.frame.width * sceneScale;
                  const height = layer.frame.height * sceneScale;
                  const isSelected = selectedLayerId === layer.id;
                  return (
                    <div
                      key={layer.id}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setSelectedLayerId(layer.id);
                        if (!activeConfigIsDraft || layer.locked) return;
                        setDragState({
                          layerId: layer.id,
                          startX: event.clientX,
                          startY: event.clientY,
                          startFrame: layer.frame,
                        });
                      }}
                      className={`absolute ${layer.visible ? "" : "opacity-25"} ${
                        isSelected ? "ring-2 ring-[#ffd700]" : ""
                      }`}
                      style={{
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        zIndex: layer.zIndex + 20,
                        cursor: activeConfigIsDraft && !layer.locked ? "grab" : "default",
                      }}
                    >
                      <img
                        src={layer.imageUrl}
                        alt={layer.name}
                        className="w-full h-full object-fill pointer-events-none select-none"
                        draggable={false}
                        style={{ opacity: layer.opacity, mixBlendMode: layer.blendMode }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        <aside className="rounded-xl border border-[#5a403c]/30 bg-[#2b1818] p-3 overflow-auto space-y-4">
          <section>
            <h2 className="text-sm uppercase tracking-wider text-[#ffdea5] mb-2">Assets</h2>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                disabled={uploadingKind !== null}
                onClick={() => backgroundInputRef.current?.click()}
                className="px-2 py-1 rounded border border-[#5a403c] text-xs hover:bg-[#472e2e] disabled:opacity-50"
              >
                {uploadingKind === "BACKGROUND" ? "Uploading..." : "Upload Background"}
              </button>
              <button
                type="button"
                disabled={uploadingKind !== null}
                onClick={() => overlayInputRef.current?.click()}
                className="px-2 py-1 rounded border border-[#5a403c] text-xs hover:bg-[#472e2e] disabled:opacity-50"
              >
                {uploadingKind === "OVERLAY" ? "Uploading..." : "Upload Overlay"}
              </button>
            </div>
            <input
              ref={backgroundInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadAsset("BACKGROUND", file);
                }
                event.currentTarget.value = "";
              }}
            />
            <input
              ref={overlayInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadAsset("OVERLAY", file);
                }
                event.currentTarget.value = "";
              }}
            />

            <div className="space-y-2 max-h-52 overflow-auto">
              {backgroundAssets.map((asset) => (
                <div key={asset.id} className="border border-[#5a403c]/40 rounded p-2 text-xs">
                  <img
                    src={asset.publicUrl}
                    alt={asset.fileName}
                    className="w-full h-20 object-cover rounded mb-2"
                  />
                  <div className="truncate">{asset.fileName}</div>
                  <button
                    type="button"
                    className="mt-2 px-2 py-1 rounded border border-[#5a403c] hover:bg-[#472e2e]"
                    onClick={() => setBackgroundAsset(asset)}
                  >
                    Set Background
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2 max-h-56 overflow-auto">
              {overlayAssets.map((asset) => (
                <div
                  key={asset.id}
                  draggable={activeConfigIsDraft}
                  onDragStart={(event) => {
                    if (!activeConfigIsDraft) return;
                    event.dataTransfer.setData(OVERLAY_DRAG_MIME, asset.id);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  className="border border-[#5a403c]/40 rounded p-2 text-xs"
                >
                  <img
                    src={asset.publicUrl}
                    alt={asset.fileName}
                    className="w-full h-16 object-contain rounded mb-2 bg-black/20"
                  />
                  <div className="truncate">{asset.fileName}</div>
                  <div className="mt-1 text-[10px] text-[#b79b95]">
                    {activeConfigIsDraft
                      ? "Drag to canvas or click Add Layer"
                      : "Create draft to edit"}
                  </div>
                  <button
                    type="button"
                    className="mt-2 px-2 py-1 rounded border border-[#5a403c] hover:bg-[#472e2e]"
                    onClick={() => addOverlayToScene(asset)}
                  >
                    Add Layer
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm uppercase tracking-wider text-[#ffdea5] mb-2">
              Layer Properties
            </h2>
            {!selectedLayer || !activeConfig ? (
              <p className="text-xs text-[#b79b95]">Select a layer to edit.</p>
            ) : (
              <fieldset
                disabled={!activeConfigIsDraft}
                className="space-y-2 text-xs disabled:opacity-70"
              >
                <input
                  className="w-full bg-[#210e0e] border border-[#5a403c]/40 rounded px-2 py-1"
                  value={selectedLayer.name}
                  onChange={(event) =>
                    patchActiveConfig((current) => ({
                      ...current,
                      layers: current.layers.map((layer) =>
                        layer.id === selectedLayer.id
                          ? { ...layer, name: event.target.value }
                          : layer
                      ),
                    }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="bg-[#210e0e] border border-[#5a403c]/40 rounded px-2 py-1"
                    type="number"
                    value={Math.round(selectedLayer.frame.x)}
                    onChange={(event) => {
                      const nextX = Number(event.target.value);
                      patchActiveConfig((current) => ({
                        ...current,
                        layers: current.layers.map((layer) =>
                          layer.id === selectedLayer.id
                            ? {
                                ...layer,
                                frame: clampSceneFrame(
                                  { ...layer.frame, x: nextX },
                                  current.backgroundWidth,
                                  current.backgroundHeight
                                ),
                              }
                            : layer
                        ),
                      }));
                    }}
                  />
                  <input
                    className="bg-[#210e0e] border border-[#5a403c]/40 rounded px-2 py-1"
                    type="number"
                    value={Math.round(selectedLayer.frame.y)}
                    onChange={(event) => {
                      const nextY = Number(event.target.value);
                      patchActiveConfig((current) => ({
                        ...current,
                        layers: current.layers.map((layer) =>
                          layer.id === selectedLayer.id
                            ? {
                                ...layer,
                                frame: clampSceneFrame(
                                  { ...layer.frame, y: nextY },
                                  current.backgroundWidth,
                                  current.backgroundHeight
                                ),
                              }
                            : layer
                        ),
                      }));
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="bg-[#210e0e] border border-[#5a403c]/40 rounded px-2 py-1"
                    type="number"
                    min={1}
                    value={Math.round(selectedLayer.frame.width)}
                    onChange={(event) => {
                      const nextWidth = Number(event.target.value);
                      patchActiveConfig((current) => ({
                        ...current,
                        layers: current.layers.map((layer) =>
                          layer.id === selectedLayer.id
                            ? {
                                ...layer,
                                frame: clampSceneFrame(
                                  { ...layer.frame, width: nextWidth },
                                  current.backgroundWidth,
                                  current.backgroundHeight
                                ),
                              }
                            : layer
                        ),
                      }));
                    }}
                  />
                  <input
                    className="bg-[#210e0e] border border-[#5a403c]/40 rounded px-2 py-1"
                    type="number"
                    min={1}
                    value={Math.round(selectedLayer.frame.height)}
                    onChange={(event) => {
                      const nextHeight = Number(event.target.value);
                      patchActiveConfig((current) => ({
                        ...current,
                        layers: current.layers.map((layer) =>
                          layer.id === selectedLayer.id
                            ? {
                                ...layer,
                                frame: clampSceneFrame(
                                  { ...layer.frame, height: nextHeight },
                                  current.backgroundWidth,
                                  current.backgroundHeight
                                ),
                              }
                            : layer
                        ),
                      }));
                    }}
                  />
                </div>
                <input
                  className="w-full bg-[#210e0e] border border-[#5a403c]/40 rounded px-2 py-1"
                  value={selectedLayer.link.href}
                  onChange={(event) =>
                    patchActiveConfig((current) => ({
                      ...current,
                      layers: current.layers.map((layer) =>
                        layer.id === selectedLayer.id
                          ? { ...layer, link: { ...layer.link, href: event.target.value } }
                          : layer
                      ),
                    }))
                  }
                />
                <input
                  className="w-full bg-[#210e0e] border border-[#5a403c]/40 rounded px-2 py-1"
                  value={selectedLayer.link.tooltip}
                  onChange={(event) =>
                    patchActiveConfig((current) => ({
                      ...current,
                      layers: current.layers.map((layer) =>
                        layer.id === selectedLayer.id
                          ? { ...layer, link: { ...layer.link, tooltip: event.target.value } }
                          : layer
                      ),
                    }))
                  }
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedLayer.visible}
                      onChange={(event) =>
                        patchActiveConfig((current) => ({
                          ...current,
                          layers: current.layers.map((layer) =>
                            layer.id === selectedLayer.id
                              ? { ...layer, visible: event.target.checked }
                              : layer
                          ),
                        }))
                      }
                    />
                    Visible
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedLayer.locked}
                      onChange={(event) =>
                        patchActiveConfig((current) => ({
                          ...current,
                          layers: current.layers.map((layer) =>
                            layer.id === selectedLayer.id
                              ? { ...layer, locked: event.target.checked }
                              : layer
                          ),
                        }))
                      }
                    />
                    Locked
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-2 py-1 rounded border border-[#5a403c]/50"
                    onClick={() =>
                      patchActiveConfig((current) => ({
                        ...current,
                        layers: current.layers.map((layer) =>
                          layer.id === selectedLayer.id
                            ? { ...layer, zIndex: Math.max(1, layer.zIndex - 1) }
                            : layer
                        ),
                      }))
                    }
                  >
                    Send Back
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 rounded border border-[#5a403c]/50"
                    onClick={() =>
                      patchActiveConfig((current) => ({
                        ...current,
                        layers: current.layers.map((layer) =>
                          layer.id === selectedLayer.id
                            ? { ...layer, zIndex: layer.zIndex + 1 }
                            : layer
                        ),
                      }))
                    }
                  >
                    Bring Front
                  </button>
                  <button
                    type="button"
                    className="ml-auto px-2 py-1 rounded border border-[#a64545]/70 text-[#ffb1b1]"
                    onClick={() =>
                      patchActiveConfig((current) => ({
                        ...current,
                        layers: current.layers.filter((layer) => layer.id !== selectedLayer.id),
                      }))
                    }
                  >
                    Delete
                  </button>
                </div>
              </fieldset>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
