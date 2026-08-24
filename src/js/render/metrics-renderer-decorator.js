import {assertRenderer} from './renderer.js';
import {getCurrentTime} from '../telemetry/clock.js';

const countRenderedEntities = function (snapshot) {
    let entityCount = Array.isArray(snapshot.food) ? snapshot.food.length : 0;
    const snakes = Array.isArray(snapshot.snakes) ? snapshot.snakes : [];

    for (const snake of snakes) {
        if (snake.alive && Array.isArray(snake.body)) {
            entityCount += snake.body.length;
        }
    }

    return entityCount;
};

class MetricsRendererDecorator {
    constructor(renderer, metrics, now = getCurrentTime) {
        this.renderer = assertRenderer(renderer);

        if (!metrics
            || typeof metrics.recordRender !== 'function'
            || typeof metrics.recordEntityCount !== 'function') {
            throw new TypeError('MetricsRendererDecorator requires runtime metrics.');
        }
        if (typeof now !== 'function') {
            throw new TypeError('MetricsRendererDecorator now must be a function.');
        }

        this.metrics = metrics;
        this.now = now;
    }

    init(config) {
        this.renderer.init(config);
    }

    render(snapshot, meta) {
        const startedAt = this.now();

        try {
            this.renderer.render(snapshot, meta);
        } finally {
            const finishedAt = this.now();
            this.metrics.recordRender(finishedAt - startedAt);
            this.metrics.recordEntityCount(countRenderedEntities(snapshot));
        }
    }

    resize(viewport) {
        this.renderer.resize(viewport);
    }

    destroy() {
        this.renderer.destroy();
    }
}

export {
    MetricsRendererDecorator,
    countRenderedEntities,
};
