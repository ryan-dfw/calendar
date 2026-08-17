export type Point = { x: number; y: number };

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function insetLoop(loop: Point[], inset: number): Point[] {
  if (inset <= 0 || loop.length < 4) return loop;
  const n = loop.length;
  const offsetEdges: { axis: "h" | "v"; value: number }[] = [];

  for (let i = 0; i < n; i++) {
    const a = loop[i];
    const b = loop[(i + 1) % n];
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    if (a.y === b.y) {
      const testPt = { x: midX, y: midY + 0.5 };
      const dir = pointInPolygon(testPt, loop) ? 1 : -1;
      offsetEdges.push({ axis: "h", value: a.y + dir * inset });
    } else {
      const testPt = { x: midX + 0.5, y: midY };
      const dir = pointInPolygon(testPt, loop) ? 1 : -1;
      offsetEdges.push({ axis: "v", value: a.x + dir * inset });
    }
  }

  const newLoop: Point[] = [];
  for (let i = 0; i < n; i++) {
    const prevEdge = offsetEdges[(i - 1 + n) % n];
    const curEdge = offsetEdges[i];
    const x = prevEdge.axis === "v" ? prevEdge.value : curEdge.value;
    const y = prevEdge.axis === "h" ? prevEdge.value : curEdge.value;
    newLoop.push({ x, y });
  }
  return newLoop;
}

function loopToRoundedPath(loop: Point[], radius: number): string {
  const n = loop.length;
  if (n < 4) return "";
  const corners = loop.map((v, i) => {
    const prev = loop[(i - 1 + n) % n];
    const next = loop[(i + 1) % n];
    const lenPrev = dist(prev, v) || 1;
    const lenNext = dist(v, next) || 1;
    const r = Math.min(radius, lenPrev / 2, lenNext / 2);
    const a = { x: v.x + ((prev.x - v.x) / lenPrev) * r, y: v.y + ((prev.y - v.y) / lenPrev) * r };
    const b = { x: v.x + ((next.x - v.x) / lenNext) * r, y: v.y + ((next.y - v.y) / lenNext) * r };
    return { v, a, b };
  });

  let d = `M ${corners[0].a.x} ${corners[0].a.y} `;
  for (let i = 0; i < n; i++) {
    const { v, b } = corners[i];
    d += `Q ${v.x} ${v.y} ${b.x} ${b.y} `;
    const nextA = corners[(i + 1) % n].a;
    d += `L ${nextA.x} ${nextA.y} `;
  }
  d += "Z";
  return d;
}

export function traceMergedRegions(
  grid: boolean[][],
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
  insetPx: number,
  cornerRadiusPx: number,
): string[] {
  const visited: boolean[][] = grid.map((col) => col.map(() => false));
  const paths: string[] = [];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (!grid[c]?.[r] || visited[c][r]) continue;

      const cells: [number, number][] = [];
      const stack: [number, number][] = [[c, r]];
      visited[c][r] = true;
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        cells.push([cx, cy]);
        const neighbors: [number, number][] = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[nx]?.[ny] && !visited[nx][ny]) {
            visited[nx][ny] = true;
            stack.push([nx, ny]);
          }
        }
      }

      const edgeSet = new Map<string, { from: Point; to: Point }>();
      const addEdge = (from: Point, to: Point) => {
        const fwd = `${from.x},${from.y}>${to.x},${to.y}`;
        const rev = `${to.x},${to.y}>${from.x},${from.y}`;
        if (edgeSet.has(rev)) edgeSet.delete(rev);
        else edgeSet.set(fwd, { from, to });
      };
      for (const [cx, cy] of cells) {
        const x0 = cx * cellW;
        const x1 = (cx + 1) * cellW;
        const y0 = cy * cellH;
        const y1 = (cy + 1) * cellH;
        addEdge({ x: x0, y: y0 }, { x: x1, y: y0 });
        addEdge({ x: x1, y: y0 }, { x: x1, y: y1 });
        addEdge({ x: x1, y: y1 }, { x: x0, y: y1 });
        addEdge({ x: x0, y: y1 }, { x: x0, y: y0 });
      }

      const startMap = new Map<string, { from: Point; to: Point }>();
      for (const e of edgeSet.values()) startMap.set(`${e.from.x},${e.from.y}`, e);
      const usedStarts = new Set<string>();
      const loops: Point[][] = [];
      for (const e of edgeSet.values()) {
        const startKey = `${e.from.x},${e.from.y}`;
        if (usedStarts.has(startKey)) continue;
        const loop: Point[] = [];
        let cur = e;
        let guard = 0;
        while (guard++ < 2000) {
          const curStartKey = `${cur.from.x},${cur.from.y}`;
          if (usedStarts.has(curStartKey)) break;
          usedStarts.add(curStartKey);
          loop.push(cur.from);
          const next = startMap.get(`${cur.to.x},${cur.to.y}`);
          if (!next) break;
          cur = next;
          if (cur.from.x === loop[0].x && cur.from.y === loop[0].y) break;
        }
        if (loop.length >= 4) loops.push(loop);
      }

      const simplify = (loop: Point[]): Point[] => {
        const out: Point[] = [];
        const n = loop.length;
        for (let i = 0; i < n; i++) {
          const prev = loop[(i - 1 + n) % n];
          const cur = loop[i];
          const next = loop[(i + 1) % n];
          const dx1 = cur.x - prev.x;
          const dy1 = cur.y - prev.y;
          const dx2 = next.x - cur.x;
          const dy2 = next.y - cur.y;
          if (dx1 * dy2 - dy1 * dx2 !== 0) out.push(cur);
        }
        return out;
      };

      for (const rawLoop of loops) {
        const simplified = simplify(rawLoop);
        if (simplified.length < 4) continue;
        const inset = insetLoop(simplified, insetPx);
        paths.push(loopToRoundedPath(inset, cornerRadiusPx));
      }
    }
  }

  return paths;
}
