import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUsers(page = 1, limit = 10, search = "", status = "ALL") {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(status !== "ALL" && { status }),
  }).toString();

  const { data, error, mutate, isLoading } = useSWR(`/api/admin/users?${query}`, fetcher, {
    keepPreviousData: true,
  });

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
}
