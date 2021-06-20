require('dotenv').config();
const db = require('./db');
const models = require('./models');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const jwt = require('jsonwebtoken');
const helmet = require('helmet')
const cors = require('cors');
const express = require('express');
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity');
const { ApolloServer } = require('apollo-server-express');


const app = express();
const port = process.env.PORT || 4000;
const DB_HOST = process.env.DB_HOST;


let notes = [
  { id: '1', content: 'This is a note', author: 'Adam Scott' },
  { id: '2', content: 'This is another note', author: 'Harlow Everly' },
  { id: '3', content: 'Oh hey look, another note!', author: 'Riley Harrison' }
];

db.connect(DB_HOST);

const getUser = token => {
  if (token) {
    try {
      // return the user information from the token
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // if there's a problem with the token, throw an error
      throw new Error('Session invalid');
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
  context: async ({ req }) => {
    // get the user token from the headers
    const token = req.headers.authorization;
    // try to retrieve a user with the token
    const user = await getUser(token);
    // add the db models and the user to the context
    return { models, user };
  }
});
server.applyMiddleware({ app, path: '/api' });


app.use(helmet());
app.use(cors())
app.listen({ port }, () =>
  console.log(
    `GraphQL Server running at http://localhost:${port}${server.graphqlPath}`
  )
);