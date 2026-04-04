export interface IdeTreeNode {
  name: string;
  fullPath: string;
  isFile: boolean;
  children?: IdeTreeNode[];
}

export function buildIdeTree(paths: string[]): IdeTreeNode {
  const root: IdeTreeNode = {
    name: "",
    fullPath: "",
    isFile: false,
    children: [],
  };

  for (const path of paths) {
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) continue;
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join("/");
      node.children = node.children ?? [];
      let child = node.children.find((c) => c.name === name);
      if (!child) {
        child = {
          name,
          fullPath,
          isFile: isLast,
          children: isLast ? undefined : [],
        };
        node.children.push(child);
      } else if (isLast) {
        child.isFile = true;
        child.children = undefined;
      }
      node = child;
    }
  }

  function sortNode(n: IdeTreeNode) {
    if (!n.children?.length) return;
    n.children.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    n.children.forEach(sortNode);
  }
  sortNode(root);
  return root;
}
