import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBoard, type BoardPayload } from "@/lib/server/circuit";

export function useBoard(slug?: string) {
  return useQuery({
    queryKey: ["board", slug ?? "p10"],
    queryFn: () => getBoard({ data: slug ? { slug } : {} }),
  });
}

export function useBoardMutation<TArgs>(
  fn: (args: TArgs) => Promise<BoardPayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (board) => {
      qc.setQueryData(["board", board.circuit.slug], board);
      if (board.circuit.slug === "p10") qc.setQueryData(["board", "p10"], board);
    },
  });
}

export function fighterById(board: BoardPayload, id: string) {
  return board.fighters.find((f) => f.id === id);
}

export function standingOf(board: BoardPayload, id: string) {
  return board.standings.find((s) => s.fighterId === id);
}
