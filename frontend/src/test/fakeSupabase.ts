import { vi } from "vitest";

type TableState = {
  data?: unknown;
  error?: { message: string } | null;
};

export class FakeSupabase {
  auth = {
    getSession: vi.fn(async () => ({
      data: { session: { access_token: "test-access-token" } },
      error: null,
    })),
    getUser: vi.fn(async () => ({
      data: { user: { id: "00000000-0000-0000-0000-000000000001" } },
      error: null,
    })),
  };

  tables = new Map<string, TableState[]>();
  calls: Array<{ filters: Array<[string, unknown]>; mode: string; payload: unknown; table: string }> = [];

  setTable(name: string, responses: TableState[]) {
    this.tables.set(name, [...responses]);
  }

  from(name: string) {
    return new FakeQuery(name, this);
  }
}

class FakeQuery implements PromiseLike<{ data: unknown; error: unknown }> {
  filters: Array<[string, unknown]> = [];
  mode = "select";
  payload: unknown = undefined;

  constructor(
    private readonly table: string,
    private readonly parent: FakeSupabase,
  ) {}

  select() {
    if (this.mode === "insert" || this.mode === "update" || this.mode === "delete") {
      return this;
    }
    return this;
  }

  insert(payload: unknown) {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.mode = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  eq(key: string, value: unknown) {
    this.filters.push([key, value]);
    return this;
  }

  is(key: string, value: unknown) {
    this.filters.push([key, value]);
    return this;
  }

  in(key: string, value: unknown) {
    this.filters.push([key, value]);
    return this;
  }

  gt(key: string, value: unknown) {
    this.filters.push([key, `gt:${String(value)}`]);
    return this;
  }

  gte(key: string, value: unknown) {
    this.filters.push([key, `gte:${String(value)}`]);
    return this;
  }

  lte(key: string, value: unknown) {
    this.filters.push([key, `lte:${String(value)}`]);
    return this;
  }

  not(key: string, operator: string, value: unknown) {
    this.filters.push([key, `${operator}:${String(value)}`]);
    return this;
  }

  order() {
    return this;
  }

  limit() {
    return this;
  }

  single() {
    return this.execute();
  }

  maybeSingle() {
    return this.execute();
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute() {
    this.parent.calls.push({
      filters: this.filters,
      mode: this.mode,
      payload: this.payload,
      table: this.table,
    });
    const responses = this.parent.tables.get(this.table) ?? [];
    const explicitResponse = responses.shift();
    this.parent.tables.set(this.table, responses);

    if (explicitResponse) {
      return {
        data: explicitResponse.data ?? null,
        error: explicitResponse.error ?? null,
      };
    }

    return { data: this.defaultData(), error: null };
  }

  private defaultData() {
    if (this.mode === "insert" || this.mode === "update") {
      return Array.isArray(this.payload) ? this.payload : this.payload;
    }
    if (this.mode === "delete") {
      return null;
    }
    return [];
  }
}
