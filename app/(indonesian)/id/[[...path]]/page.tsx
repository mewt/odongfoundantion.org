import { renderRoute, routeMetadata, staticPaths, type RouteProps } from "@/lib/routes";
export const revalidate = 60;
export function generateStaticParams() { return staticPaths.map((path) => ({ path: path ? [path] : [] })); }
export function generateMetadata(props: RouteProps) { return routeMetadata(props, "id"); }
export default function Page(props: RouteProps) { return renderRoute(props, "id"); }
