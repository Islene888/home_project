import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase配置 - 真实项目配置
const firebaseConfig = {
  apiKey: "AIzaSyBTJITUmA8N9Uf0AvxW3FeBuHzJAgYRe5g",
  authDomain: "voyager-design-editor.firebaseapp.com",
  databaseURL: "https://voyager-design-editor-default-rtdb.firebaseio.com",
  projectId: "voyager-design-editor",
  storageBucket: "voyager-design-editor.firebasestorage.app",
  messagingSenderId: "164979711102",
  appId: "1:164979711102:web:45ac4b084829d15e8c0c2f",
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);

// 导出服务
export const database = getDatabase(app);
export const auth = getAuth(app);
export default app;
