import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Helper function to get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const PROJECTS_FILE = path.join(__dirname, '..', 'projects.json');

const UNSPLASH_ACCESS_KEY = '18OerCUXhFCbPipqd27WL84AXgm3AQJojY2zoFM0TSM'; 

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Helper function to read projects from the JSON file
const readProjects = () => {
    if (!fs.existsSync(PROJECTS_FILE)) {
        return {};
    }
    const data = fs.readFileSync(PROJECTS_FILE);
    return JSON.parse(data);
};

// Helper function to write projects to the JSON file
const writeProjects = (projects) => {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
};

const searchUnsplashImages = async (query) => {
    try {
        const response = await axios.get('https://api.unsplash.com/search/photos', {
            params: { query },
            headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
        });

        return response.data.results.map(image => ({
            id: image.id,
            thumb_url: image.urls.thumb,
            name: image.alt_description || 'Unnamed',
            description: image.description || 'No description available'
        }));
    } catch (error) {
        console.error('Error fetching images from Unsplash:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch images from Unsplash');
    }
};

// Helper function to generate a 13-character project identifier
const generateProjectId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let projectId = '';
    for (let i = 0; i < 13; i++) {
        projectId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return projectId;
};

// Project schema for yup validation
const projectSchema = yup.object().shape({
    name: yup.string().required(),
    summary: yup.string().min(20).max(80).required(),
    manager: yup.object().shape({
        name: yup.string().required(),
        email: yup.string().email().required()
    }).required(),
    team: yup.array().of(yup.object().shape({
        name: yup.string().required(),
        email: yup.string().email().required(),
        role: yup.string().required()
    })).required(),
    start_date: yup.date().required()
});

// Route to get the list of projects
app.get('/projects', (req, res) => {
    const projects = readProjects();
    res.json(projects);
});

// Route to get a single project's details
app.get('/projects/:id', (req, res) => {
    const { id } = req.params;
    const projects = readProjects();
    const project = projects[id];

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
});

// Route to create a new project
app.post('/projects', async (req, res) => {
    try {
        await projectSchema.validate(req.body);
        const projects = readProjects();
        const projectId = generateProjectId(); // Use the new project identifier generator
        const project = {
            name: req.body.name,
            summary: req.body.summary,
            images: [],
            manager: req.body.manager,
            team: req.body.team,
            start_date: req.body.start_date,
            id: projectId
        };

        projects[projectId] = project;
        writeProjects(projects);

        res.status(201).json({ id: projectId });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route to update a project
app.put('/projects/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await projectSchema.validate(req.body);

        const projects = readProjects();
        const project = projects[id];

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        project.name = req.body.name;
        project.summary = req.body.summary;
        project.start_date = req.body.start_date;
        project.manager = req.body.manager;
        project.team = req.body.team;

        projects[id] = project;
        writeProjects(projects);

        res.status(200).json({ message: 'Project updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route to add images to a project
app.post('/projects/:id/images', (req, res) => {
    const { id } = req.params;
    const { thumb_url, name, description } = req.body;

    const projects = readProjects();
    const project = projects[id];

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const newImage = {
        thumb: thumb_url,
        id: uuidv4(),
        description
    };

    project.images.push(newImage);
    writeProjects(projects);

    res.status(200).json({ message: 'Image added successfully' });
});

// Route to delete an image from a project
app.delete('/projects/:projectId/images/:imageId', (req, res) => {
    const { projectId, imageId } = req.params;
    const projects = readProjects();
    const project = projects[projectId];

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    project.images = project.images.filter(img => img.id !== imageId);
    writeProjects(projects);

    res.status(200).json({ message: 'Image deleted successfully' });
});

// Route to delete a project
app.delete('/projects/:id', (req, res) => {
    const { id } = req.params;
    const projects = readProjects();

    if (!projects[id]) {
        return res.status(404).json({ error: 'Project not found' });
    }

    delete projects[id];
    writeProjects(projects);

    res.status(200).json({ message: 'Project deleted successfully' });
});

app.post('/unsplash', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const images = await searchUnsplashImages(query);
        res.status(200).json(images);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.listen(PORT, 'localhost', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
