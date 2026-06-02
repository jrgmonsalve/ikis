import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { tasks } from './db/schema';
import { eq } from 'drizzle-orm';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS configuration to allow local and remote web access
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'ikis-backend',
    timestamp: new Date().toISOString()
  });
});

// GET all tasks
app.get('/api/tasks', async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const allTasks = await db.select().from(tasks).all();
    return c.json(allTasks);
  } catch (error: any) {
    return c.json({ error: error.message || 'Database error' }, 500);
  }
});

// GET a task by ID
app.get('/api/tasks/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400);
    }
    const db = drizzle(c.env.DB);
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).get();
    if (!result) {
      return c.json({ error: 'Task not found' }, 404);
    }
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message || 'Database error' }, 500);
  }
});

// POST a new task
app.post('/api/tasks', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    const db = drizzle(c.env.DB);
    const result = await db.insert(tasks).values({
      title: body.title,
      description: body.description || null,
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      dueDate: body.dueDate || null,
    }).returning().get();

    return c.json(result, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Database error' }, 500);
  }
});

// PUT (update) a task
app.put('/api/tasks/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400);
    }
    const body = await c.req.json();
    const db = drizzle(c.env.DB);

    const updatedData: any = {};
    if (body.title !== undefined) updatedData.title = body.title;
    if (body.description !== undefined) updatedData.description = body.description;
    if (body.status !== undefined) updatedData.status = body.status;
    if (body.priority !== undefined) updatedData.priority = body.priority;
    if (body.dueDate !== undefined) updatedData.dueDate = body.dueDate;
    updatedData.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const result = await db.update(tasks)
      .set(updatedData)
      .where(eq(tasks.id, id))
      .returning()
      .get();

    if (!result) {
      return c.json({ error: 'Task not found or not updated' }, 404);
    }

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message || 'Database error' }, 500);
  }
});

// DELETE a task
app.delete('/api/tasks/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400);
    }
    const db = drizzle(c.env.DB);
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning().get();
    
    if (!result) {
      return c.json({ error: 'Task not found' }, 404);
    }

    return c.json({ success: true, message: 'Task deleted successfully', deletedTask: result });
  } catch (error: any) {
    return c.json({ error: error.message || 'Database error' }, 500);
  }
});

export default app;
