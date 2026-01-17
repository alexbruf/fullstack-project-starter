
export default {
	async scheduled(controller) {
		console.log("Cron job executed at", new Date().toISOString());
	}
} satisfies ExportedHandler<Env>;
