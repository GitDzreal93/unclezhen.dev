import { query } from "./db";

export type Post = {
  id: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  body: string;
};

export type Project = {
  id: string;
  name: string;
  type: string;
  year: string;
  blurb: string;
  problem: string;
  solution: string;
  result: string;
  stack: string[];
  role: string;
};

export type Course = {
  id: string;
  title: string;
  level: string;
  hours: string;
  price: number;
  audience: string;
  outcome: string;
  outline: string[];
  tag: string;
};

export type Product = {
  id: string;
  name: string;
  cat: string;
  price: number;
  descr: string;
};

// Format a Date/string as YYYY-MM-DD in a stable way.
function fmtDate(d: unknown): string {
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return String(d ?? "");
}

export async function getPosts(): Promise<Post[]> {
  const rows = await query<any>(
    "SELECT id,title,date,tags,excerpt,body FROM posts ORDER BY date DESC, sort ASC"
  );
  return rows.map((r) => ({ ...r, date: fmtDate(r.date) }));
}

export async function getProjects(): Promise<Project[]> {
  return query<Project>(
    "SELECT id,name,type,year,blurb,problem,solution,result,stack,role FROM projects ORDER BY sort ASC"
  );
}

export async function getCourses(): Promise<Course[]> {
  return query<Course>(
    "SELECT id,title,level,hours,price,audience,outcome,outline,tag FROM courses ORDER BY sort ASC"
  );
}

export async function getProducts(): Promise<Product[]> {
  return query<Product>(
    "SELECT id,name,cat,price,descr FROM products ORDER BY sort ASC"
  );
}
