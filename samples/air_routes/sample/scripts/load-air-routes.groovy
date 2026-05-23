// An init script that returns a Map allows explicit setting of global bindings.
def globals = [:]

// Generates the air routes graph into an "empty" TinkerGraph via LifeCycleHook.
// Uses TinkerFactory.generateAirRoutes() which is built into TinkerPop 3.8+.
globals << [hook : [
  onStartUp: { ctx ->
    ctx.logger.info("Loading air routes dataset.")
    TinkerFactory.generateAirRoutes(graph)
  }
] as LifeCycleHook]

// Define the default TraversalSource to bind queries to.
globals << [g : traversal().withEmbedded(graph)]
