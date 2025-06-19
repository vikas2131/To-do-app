import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Edit, X, Plus } from "lucide-react";

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch tasks from MongoDB
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
  });

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: newTaskText.trim(),
            completed: false
          }),
        });
        const newTask = await response.json();
        setTasks([...tasks, newTask]);
        setNewTaskText("");
      } catch (error) {
        console.error('Error creating task:', error);
      }
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !task.completed
        }),
      });
      const updatedTask = await response.json();
      setTasks(tasks.map(t => 
        t.id === task.id ? updatedTask : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = async () => {
    if (editText.trim() && editingId) {
      try {
        const response = await fetch(`/api/tasks/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: editText.trim()
          }),
        });
        const updatedTask = await response.json();
        setTasks(tasks.map(t => 
          t.id === editingId ? updatedTask : t
        ));
        setEditingId(null);
        setEditText("");
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
  };

  const deleteTaskById = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const pendingCount = tasks.filter(task => !task.completed).length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-gray-500 text-sm">Stay organized and productive</p>
        </div>

        <form onSubmit={addTask} className="mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Add a new task..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 pr-20"
            />
            <Button
              type="submit"
              disabled={!newTaskText.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 transition-colors duration-200 font-medium h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </form>

        <div className="flex space-x-2 mb-6 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === "all"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white"
            }`}
          >
            All <span className="ml-1 text-xs bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">{totalCount}</span>
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === "pending"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white"
            }`}
          >
            Pending <span className="ml-1 text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{pendingCount}</span>
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === "completed"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white"
            }`}
          >
            Done <span className="ml-1 text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{completedCount}</span>
          </button>
        </div>

        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-3">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="text-gray-600 font-medium mb-2">
                {filter === "all" && "No tasks yet"}
                {filter === "pending" && "No pending tasks"}
                {filter === "completed" && "No completed tasks"}
              </h3>
              <p className="text-gray-500 text-sm">
                {filter === "all" && "Add your first task above to get started!"}
                {filter === "pending" && "All tasks are completed!"}
                {filter === "completed" && "Complete some tasks to see them here!"}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200 ${
                  task.completed
                    ? "bg-green-50 hover:bg-green-100 hover:border-green-200"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <button
                  onClick={() => toggleTask(task)}
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center group-hover:scale-110 ${
                    task.completed
                      ? "bg-green-500 border-green-500 hover:bg-green-600"
                      : "border-gray-300 hover:border-blue-500"
                  }`}
                >
                  {task.completed && <Check className="w-3 h-3 text-white" />}
                </button>

                {editingId === task.id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-gray-900"
                    autoFocus
                  />
                ) : (
                  <span
                    className={`flex-1 transition-colors duration-200 ${
                      task.completed
                        ? "text-gray-600 line-through"
                        : "text-gray-900 group-hover:text-gray-700"
                    }`}
                  >
                    {task.text}
                  </span>
                )}

                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => startEdit(task)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Edit task"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTaskById(task.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Delete task"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {totalCount > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{completedCount} of {totalCount} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
