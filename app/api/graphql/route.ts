// src/app/api/graphql/route.ts
import { createSchema, createYoga } from "graphql-yoga";
import { prisma } from "../../../lib/prisma"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("Missing JWT_SECRET environment variable");
  return s;
}

function getJwtExpiry(): string {
  return process.env.JWT_EXPIRY ?? "1d";
}

const typeDefs = /* GraphQL */ `
  type User {
    id: String!
    name: String!
    email: String!
    password: String!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    users: [User!]!
    me: User
  }

  input SignupInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Mutation {
    signup(data: SignupInput!): AuthPayload!
    login(data: LoginInput!): AuthPayload!
  }
`;

function signToken(payload: string | object) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: getJwtExpiry() as jwt.SignOptions["expiresIn"] });
}

const resolvers = {
  Query: {
    users: async () => {
      return prisma.user.findMany();
    },
    me: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) return null;
      return prisma.user.findUnique({ where: { id: ctx.user.id } });
    },
  },
  Mutation: {
    signup: async (_: any, { data }: any) => {
      const { name, email, password } = data;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new Error("Email already in use");
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, password: hashed },
      });
      const token = signToken({ id: user.id, email: user.email });
      return { token, user };
    },

    login: async (_: any, { data }: any) => {
      const { email, password } = data;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("Invalid credentials");
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) throw new Error("Invalid credentials");
      const token = signToken({ id: user.id, email: user.email });
      return { token, user };
    },
  },
};

const schema = createSchema({ typeDefs, resolvers });

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  context: async ({ request }) => {
    try {
      const auth = request.headers.get("authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!token) return { user: null };
      const verified = jwt.verify(token, getJwtSecret());
      const decoded = verified as unknown as { id: string; email: string };
      return { user: decoded };
    } catch (err) {
      return { user: null };
    }
  },
});

// export Next-compatible request handlers that delegate to Yoga
const handler = async (request: Request) => {
  return yoga.handleRequest(request, {});
};

export { handler as GET, handler as POST };
