import type { Route } from "./+types/page";
import type {
  CreateTodoRequest,
  ListTodosResponse,
  UpdateTodoRequest,
} from "~/api/api";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { RiCheckboxCircleLine, RiDownloadLine } from "@remixicon/react";
import { CreateTodoDialog } from "./create-todo-dialog";
import { Button } from "~/components/ui/button";
import { useFetcher } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My Todos" },
    { name: "description", content: "Manage your todos" },
  ];
}

export async function clientLoader(args: Route.ClientLoaderArgs) {
  const params = new URL(args.request.url).searchParams;
  const passthroughParams = new URLSearchParams();
  if (params.has("limit")) {
    passthroughParams.set("limit", params.get("limit")!);
  }
  if (params.has("offset")) {
    passthroughParams.set("offset", params.get("offset")!);
  }
  const todosResponse = await fetch(
    `/api/todo?${passthroughParams.toString()}`,
  );
  const { todos } = (await todosResponse.json()) as ListTodosResponse;
  return { todos };
}

class TodoFacade {
  static async createTodo(request: CreateTodoRequest) {
    return await fetch("/api/todo", {
      body: JSON.stringify(request),
      method: "POST",
    }).then((r) => r.json());
  }
  static async updateTodo(id: number, request: UpdateTodoRequest) {
    return await fetch(`/api/todo/${id}`, {
      body: JSON.stringify(request),
      method: "PUT",
    }).then((r) => r.json());
  }
  static async deleteTodo(id: number) {
    return await fetch(`/api/todo/${id}`, {
      method: "DELETE",
    });
  }
  static async exportTodos() {
    return await fetch("/api/todo/export", {
      method: "POST",
    }).then((r) => r.json() as Promise<{ url: string }>);
  }
}

export async function clientAction(args: Route.ClientActionArgs) {
  const formData = await args.request.formData();
  const action = formData.get("action");

  switch (action) {
    case "create": {
      const title = formData.get("title");
      if (!title || typeof title !== "string")
        return { error: true, message: "No Title" };
      return { create: await TodoFacade.createTodo({ title }) };
    }
    case "update": {
      const title = formData.get("title");
      const checkedDate = formData.get("checkedDate");
      const id = formData.get("id");
      if (!id || typeof id !== "string")
        return { error: true, message: "No id provided" };
      return {
        update: await TodoFacade.updateTodo(parseInt(id), {
          title: typeof title === "string" ? title : undefined,
          checkedDate: checkedDate === "null" ? null : (checkedDate as string),
        }),
      };
    }
    case "delete": {
      const id = formData.get("id");
      if (!id || typeof id !== "string")
        return { error: true, message: "No id provided" };
      return { delete: await TodoFacade.deleteTodo(parseInt(id)) };
    }
    case "export": {
      const { url } = await TodoFacade.exportTodos();
      return { export: { url } };
    }
  }
}

function EmptyTodos({
  onCreateTodo,
}: {
  onCreateTodo: (title: string) => void;
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiCheckboxCircleLine />
        </EmptyMedia>
        <EmptyTitle>No todos yet</EmptyTitle>
        <EmptyDescription>
          Create your first todo to get started organizing your tasks.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CreateTodoDialog onCreateTodo={onCreateTodo} />
      </EmptyContent>
    </Empty>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const exportFetcher = useFetcher<{ export: { url: string } }>();
  const isLoading = fetcher.state !== "idle";
  const isExporting = exportFetcher.state !== "idle";

  // Download when export completes
  if (exportFetcher.data?.export?.url && exportFetcher.state === "idle") {
    window.open(exportFetcher.data.export.url, "_blank");
    exportFetcher.data = undefined;
  }

  const handleCreateTodo = (title: string) => {
    fetcher.submit({ action: "create", title }, { method: "post" });
  };

  const handleExport = () => {
    exportFetcher.submit({ action: "export" }, { method: "post" });
  };

  const handleToggleComplete = (id: number, isCompleted: boolean) => {
    const checkedDate = isCompleted ? "null" : new Date().toISOString();
    fetcher.submit(
      { action: "update", id: id.toString(), checkedDate },
      { method: "post" },
    );
  };

  const handleDeleteTodo = (id: number) => {
    fetcher.submit({ action: "delete", id: id.toString() }, { method: "post" });
  };

  const handleUpdateTitle = (id: number, title: string) => {
    fetcher.submit(
      { action: "update", id: id.toString(), title },
      { method: "post" },
    );
  };

  return (
    <div className="container mx-auto py-10 max-w-screen-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Todos</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || loaderData.todos.length === 0}
          >
            <RiDownloadLine />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <CreateTodoDialog
            onCreateTodo={handleCreateTodo}
            isLoading={isLoading}
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={loaderData.todos}
        empty={<EmptyTodos onCreateTodo={handleCreateTodo} />}
        meta={{
          onToggleComplete: handleToggleComplete,
          onDeleteTodo: handleDeleteTodo,
          onUpdateTitle: handleUpdateTitle,
          isLoading,
        }}
      />
    </div>
  );
}
