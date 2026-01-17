export default {
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      console.log('Received', message);
    }
  }
} satisfies ExportedHandler<Env>;
