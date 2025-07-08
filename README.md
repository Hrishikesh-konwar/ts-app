npm init -y
npm i express cors dotenv
npm i -D typescript nodemon ts-node @types/express @types/dotenv @types/cors
npx tsc --init
npm run dev


//package.json changes
"scripts": {
    "start": "node dist/server.js",
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "test": "echo \"Error: no test specified\" && exit 1"
  },


  //tsc changes
"outDir": "./dist",  
