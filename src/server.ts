import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import xss from 'xss';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: 'http://127.0.0.1:3000',
  })
);

const dataFilePath = path.join(__dirname, 'database.json');

const readDB = (): Data => {
  const rawData = fs.readFileSync(dataFilePath, 'utf-8');
  return JSON.parse(rawData);
};

const writeDB = (data: Data): void => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
};

const initDatabase = (): void => {
  const initialData: Data = {
    users: [
      {
        id: 1,
        name: 'John',
        password: 'super_secret_password_from_john',
      },
      {
        id: 2,
        name: 'Alice',
        password: 'super_secret_password_from_alice',
      },
    ],
    posts: [
      {
        id: 1,
        title: 'Web app security',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vitae ligula in urna finibus ullamcorper et at mi. Quisque mauris turpis, dignissim sed vehicula a, dapibus euismod mauris. Sed non odio a tortor ornare mollis eget at elit. Suspendisse potenti.',
      },
      {
        id: 2,
        title: 'OWASP Top 10',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vitae ligula in urna finibus ullamcorper et at mi. Quisque mauris turpis, dignissim sed vehicula a, dapibus euismod mauris. Sed non odio a tortor ornare mollis eget at elit. Suspendisse potenti.',
      },
    ],
  };
  writeDB(initialData);
};

initDatabase();

type User = {
  id: number;
  name: string;
  password: string;
};

type Post = {
  id: number;
  title: string;
  text: string;
};

type Data = {
  users: User[];
  posts: Post[];
};

app.get('/api/users', (req: Request, res: Response) => {
  const data = readDB();

  const vulnerability = req.query.vulnerability as string | undefined;

  if (vulnerability === 'true') {
    res.status(200).json({
      status: 200,
      data: data.users,
    });
  } else {
    res.status(200).json({
      status: 200,
      data: data.users.map((user) => ({
        id: user.id,
        name: user.name,
      })),
    });
  }
});

app.get('/api/posts', (req: Request, res: Response) => {
  const data = readDB();
  res.status(200).json({
    status: 200,
    data: data.posts,
  });
});

type CreatePostBody = {
  title: string;
  text: string;
};

app.post('/api/posts', (req: Request, res: Response) => {
  const body: CreatePostBody = req.body;
  const vulnerability = req.query.vulnerability as string | undefined;

  if (!body.text || !body.title) {
    res.status(400).json({
      status: 400,
      error: 'Invalid input.',
    });
  } else {
    const data = readDB();
    const id = data.posts.length + 1;
    let title = body.title;
    let text = body.text;

    if (vulnerability !== 'true') {
      title = xss(body.title);
      text = xss(body.text);
    }

    const newPost: Post = {
      id: id,
      title: title,
      text: text,
    };

    data.posts.push(newPost);
    writeDB(data);
    res.status(201).json({
      status: 201,
      post: newPost,
    });
  }
});

const hostname = '127.0.0.1';
const port = 5000;
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
