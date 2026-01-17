
# Todo App

A todo application built with a full-stack JavaScript framework.

features:
- login (clerk)
- register
- add todo
- delete todo (d1)
- mark todo as completed (update) and edit todo
- email when todo complete (queue example, resend)
- email daily summary of todos (cron example)
- export todos to CSV (r2 example)


# getting started (setting up wrangler stuff)

1. get d1 database set up
` wrangler d1 create "todo-db" --binding="TODO_DB" `

2. get r2 bucket set up
` wrangler r2 bucket create "todo-exports" --binding="TODO_EXPORTS" `

3. get queue set up
` wrangler queue create "email-queue"` 
```
Configure your Worker to send messages to this queue:

{
  "queues": {
    "producers": [
      {
        "queue": "email-queue",
        "binding": "EMAIL_QUEUE"
      }
    ]
  }
}
Configure your Worker to consume messages from this queue:

{
  "queues": {
    "consumers": [
      {
        "queue": "email-queue"
      }
    ]
  }
}
```


env variables (.dev.vars):
`VITE_CLERK_PUBLISHABLE_KEY=`
`CLERK_SECRET_KEY=`
`RESEND_API_KEY=`

