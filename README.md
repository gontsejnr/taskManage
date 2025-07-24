# Simple Task Management App - MERN Stack

A minimal task management application with deadlines and priorities, built for beginners learning the MERN stack.

## 🌟 Features

- ✅ Create, read, update, and delete tasks
- 📅 Set deadlines for tasks
- 🎯 Assign priority levels (High, Medium, Low)
- ✔️ Mark tasks as complete/incomplete
- 🎨 Clean, responsive UI with Tailwind CSS
- ⚡ Real-time task sorting by priority and completion status
- 🚨 Visual indicators for overdue tasks

## 🛠️ Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **HTTP Client**: Axios
- 
## 🚀 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

### Backend Setup

1. **Create and initialize the server directory:**
```bash
mkdir task-management-app
cd task-management-app
mkdir server
cd server
npm init -y
```

2. **Install backend dependencies:**
```bash
npm install express mongoose cors dotenv
npm install -D nodemon
```

3. **Create the main server file (`server.js`):**
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', require('./routes/tasks'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

4. **Create the Task model (`models/Task.js`):**
```javascript
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  deadline: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', TaskSchema);
```

5. **Create API routes (`routes/tasks.js`):**
```javascript
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
```

6. **Update package.json scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Frontend Setup

1. **Create React application:**
```bash
cd ..
npm create vite client
cd client
```

2. **Install frontend dependencies:**
```bash
npm install axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

3. **Configure Tailwind CSS (`tailwind.config.js`):**
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

4. **Update styles (`src/index.css`):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f9fafb;
}
```

## 🏃‍♂️ Running the Application

1. **Start the backend server:**
```bash
cd server
npm run dev
```

2. **Start the frontend (in a new terminal):**
```bash
cd client
npm start
```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 🔧 Environment Variables

Create a `.env` file in the server directory:

```env
MONGODB_URI=mongodb://localhost:27017/taskmanager
PORT=5001
```

For MongoDB Atlas (cloud database):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskmanager
PORT=5001
```

## 📚 Learning Points for Beginners

### MERN Stack Components:
- **MongoDB**: NoSQL database to store task data
- **Express.js**: Backend web framework for creating REST API
- **React.js**: Frontend library for building user interfaces
- **Node.js**: JavaScript runtime environment for server-side development

### Key Concepts Covered:
- RESTful API design (GET, POST, PUT, DELETE operations)
- React hooks (`useState`, `useEffect`) for state management
- Axios for making HTTP requests from frontend to backend
- Mongoose ODM for MongoDB object modeling
- Tailwind CSS utility-first styling approach
- Component-based React architecture

### Best Practices Demonstrated:
- Clean and modular component structure
- Proper error handling in both frontend and backend
- Responsive web design principles
- Form validation and user input handling
- Efficient state management patterns

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Retrieve all tasks |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/:id` | Update an existing task |
| DELETE | `/api/tasks/:id` | Delete a task |

## 🎨 UI Features

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Priority-based Sorting**: Tasks automatically sorted by priority and completion status
- **Visual Indicators**: Color-coded priority levels and overdue task alerts
- **Interactive Elements**: Checkbox completion, inline editing, and deletion
- **Clean Typography**: Professional appearance with Tailwind CSS

## 🚀 Next Steps & Enhancements

- 🔐 Add user authentication and authorization
- 📂 Implement task categories and tags
- 🔔 Add due date notifications and reminders
- 🔍 Create advanced search and filtering capabilities
- 📊 Add task analytics and progress tracking
- 🌙 Implement dark mode toggle
- 📱 Create mobile app version with React Native
- 🔄 Add real-time updates with WebSockets

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🆘 Troubleshooting

### Common Issues:

**MongoDB Connection Error:**
- Ensure MongoDB is running locally or check your Atlas connection string
- Verify the database URI in your `.env` file

**CORS Errors:**
- Make sure the CORS middleware is properly configured in your Express server
- Check that your frontend is running on the correct port (3000)

**Module Not Found Errors:**
- Run `npm install` in both client and server directories
- Ensure all dependencies are listed in respective package.json files

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information about your problem
