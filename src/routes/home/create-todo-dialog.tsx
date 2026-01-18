import { RiAddLine } from "@remixicon/react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";

interface CreateTodoDialogProps {
  onCreateTodo: (title: string) => void;
  isLoading?: boolean;
}

export function CreateTodoDialog({ onCreateTodo, isLoading }: CreateTodoDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (title.trim()) {
      onCreateTodo(title.trim());
      setTitle("");
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button size="sm" disabled={isLoading} />}>
        <RiAddLine />
        Add Todo
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Create New Todo</AlertDialogTitle>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="todo-title">Title</FieldLabel>
          <Input
            id="todo-title"
            placeholder="Enter todo title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setTitle("")}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={!title.trim()}>
            Create
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
