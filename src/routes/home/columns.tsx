import { RiDeleteBinLine, RiMoreLine } from "@remixicon/react";
import type { ColumnDef, RowData } from "@tanstack/react-table";
import { useState } from "react";
import type { ListTodosResponse } from "~/api/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";

export type Todo = ListTodosResponse["todos"][number];

declare module "@tanstack/react-table" {
  // biome-ignore lint/correctness/noUnusedVariables: module augmentation requires matching signature
  interface TableMeta<TData extends RowData> {
    onToggleComplete?: (id: number, isCompleted: boolean) => void;
    onDeleteTodo?: (id: number) => void;
    onUpdateTitle?: (id: number, title: string) => void;
    isLoading?: boolean;
  }
}

function EditableTitle({
  todo,
  onSave,
  disabled,
}: {
  todo: Todo;
  onSave: (title: string) => void;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(todo.title);
  const isCompleted = !!todo.completed_date;

  const handleSave = () => {
    setIsEditing(false);
    if (value.trim() && value !== todo.title) {
      onSave(value.trim());
    } else {
      setValue(todo.title);
    }
  };

  if (isEditing) {
    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setValue(todo.title);
            setIsEditing(false);
          }
        }}
        autoFocus
        className="h-7 -my-1"
      />
    );
  }

  return (
    <span
      onClick={() => !disabled && setIsEditing(true)}
      className={`cursor-pointer hover:underline ${
        isCompleted ? "line-through text-muted-foreground" : ""
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {todo.title}
    </span>
  );
}

export const columns: ColumnDef<Todo>[] = [
  {
    id: "completed",
    header: "",
    size: 40,
    cell: ({ row, table }) => {
      const todo = row.original;
      const isCompleted = !!todo.completed_date;
      const isLoading = table.options.meta?.isLoading;

      return (
        <Checkbox
          checked={isCompleted}
          disabled={isLoading}
          onCheckedChange={() => table.options.meta?.onToggleComplete?.(todo.id, isCompleted)}
          aria-label="Toggle complete"
        />
      );
    },
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row, table }) => {
      const todo = row.original;
      const isLoading = table.options.meta?.isLoading;

      return (
        <EditableTitle
          todo={todo}
          onSave={(title) => table.options.meta?.onUpdateTitle?.(todo.id, title)}
          disabled={isLoading}
        />
      );
    },
  },
  {
    id: "actions",
    header: "",
    size: 40,
    cell: ({ row, table }) => {
      const todo = row.original;
      const isLoading = table.options.meta?.isLoading;

      return (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" disabled={isLoading} />}
            >
              <RiMoreLine className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <AlertDialogTrigger
                render={
                  <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()} />
                }
              >
                <RiDeleteBinLine />
                Delete
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Todo</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{todo.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => table.options.meta?.onDeleteTodo?.(todo.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];
