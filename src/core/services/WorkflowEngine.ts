type EventCallback = (payload: any) => void;

class WorkflowEngine {
  private listeners: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, payload: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(payload);
      } catch (err) {
        console.error(`Error executing workflow for event ${event}:`, err);
      }
    });
  }
}

export const workflowEngine = new WorkflowEngine();

// Setup some default workflows
workflowEngine.on('incident:created', (payload) => {
  console.log('[Workflow] High severity incident detected! Triggering alert to management.', payload);
  // Could trigger an email, SMS, or another service call here
});

workflowEngine.on('claim:rejected', (payload) => {
  console.log('[Workflow] Claim rejected. Triggering review workflow for billing coordinator.', payload);
});
