import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { promises as fs } from "fs";
import { resolve } from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Simple file-based storage that mimics MongoDB structure
const DATA_FILE = process.env.NODE_ENV === 'development' 
  ? resolve(process.cwd(), 'tasks.json')
  : resolve(__dirname, '..', 'tasks.json');



let taskData: any[] = [];
let nextId = 1;

// Initialize data file
const initializeStorage = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    taskData = JSON.parse(data);
    if (taskData.length > 0) {
      nextId = Math.max(...taskData.map(t => parseInt(t.id))) + 1;
    }
    console.log(`Loaded ${taskData.length} tasks from ${DATA_FILE}`);
  } catch (error) {
    // File doesn't exist, start with empty array
    taskData = [];
    await saveData();
    console.log(`Created new tasks file at ${DATA_FILE}`);
  }
};

const saveData = async () => {
  await fs.writeFile(DATA_FILE, JSON.stringify(taskData, null, 2));
};

const generateId = () => {
  return (nextId++).toString();
};

// Initialize storage on startup
initializeStorage();

const taskSchema = z.object({
  text: z.string().min(1),
  completed: z.boolean().optional().default(false)
});

const updateTaskSchema = z.object({
  text: z.string().min(1).optional(),
  completed: z.boolean().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      res.json(taskData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = taskSchema.parse(req.body);
      const newTask = {
        id: generateId(),
        text: validatedData.text,
        completed: validatedData.completed || false,
        createdAt: new Date().toISOString()
      };
      taskData.push(newTask);
      await saveData();
      res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  // Update a task
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateTaskSchema.parse(req.body);
      
      const taskIndex = taskData.findIndex(t => t.id === id);
      if (taskIndex === -1) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      taskData[taskIndex] = { ...taskData[taskIndex], ...validatedData };
      await saveData();
      res.json(taskData[taskIndex]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  });

  // Delete a task
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const initialLength = taskData.length;
      taskData = taskData.filter(t => t.id !== id);
      
      if (taskData.length < initialLength) {
        await saveData();
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
