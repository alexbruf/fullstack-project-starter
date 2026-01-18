interface EmailTemplateProps {
  todos: string[];
}

const dateFormatter = Intl.DateTimeFormat("en-US");
export function DailyEmail({ todos }: EmailTemplateProps) {
  return (
    <div>
      <h1>Completed todos: {dateFormatter.format(new Date())}</h1>
      <ul>
        {todos.length === 0 ? (
          <p>No todos completed today.</p>
        ) : (
          todos.map((todo, index) => <li key={index}>{todo}</li>)
        )}
      </ul>
    </div>
  );
}
