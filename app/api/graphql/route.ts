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
  enum Role {
    MENTOR
    MENTEE
  }

  enum Domain {
    SOFTWARE
    MANAGEMENT
    MARKETING
    ANALYST
    OTHER
  }

  enum Branch {
    CSE
    ECE
    ICE
    MME
    EEE
    OTHER
  }

  type User {
    id: String!
    name: String!
    email: String!
    password: String!
    imageUrl: String!
    role: Role!
    yearOfStudy: Int
    domain: Domain
    branch: Branch
    companies: [String!]!
    companiesInterested: [String!]!
    createdAt: String!
  }

  enum RequestStatus {
    PENDING
    ACCEPTED
    REJECTED
  }

  type FollowRequest {
    mentorId: String!
    menteeId: String!
    status: RequestStatus!
    createdAt: String!
    updatedAt: String!
    mentor: User!
    mentee: User!
  }

  input UserFilter {
    role: Role
    name: String
    domain: Domain
    branch: Branch
    yearOfStudy: Int
    company: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    users: [User!]!
    me: User
    searchUsers(filter: UserFilter): [User!]!
    recommendedMentors: [User!]!
    myMentees: [User!]!
    myPendingRequests: [FollowRequest!]!
  }

  input SignupInput {
    name: String!
    email: String!
    password: String!
    role: Role!
    yearOfStudy: Int
    domain: Domain
    branch: Branch
    companies: [String!]
    companiesInterested: [String!]
  }

  input LoginInput {
    email: String!
    password: String!
  }

  enum RequestAction {
    ACCEPT
    REJECT
  }

  type Mutation {
    signup(data: SignupInput!): AuthPayload!
    login(data: LoginInput!): AuthPayload!
    sendFollowRequest(mentorId: String!): Boolean!
    respondFollowRequest(menteeId: String!, action: RequestAction!): Boolean!
    updateProfileImage(imageUrl: String!): User!
  }
`;

function signToken(payload: string | object) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiry() as jwt.SignOptions["expiresIn"],
  });
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
    searchUsers: async (_: any, { filter }: any) => {
      const where: any = {};
      if (filter?.role) where.role = filter.role;
      if (filter?.name)
        where.name = { contains: filter.name, mode: "insensitive" };
      if (filter?.domain) where.domain = filter.domain;
      if (filter?.branch) where.branch = filter.branch;
      if (typeof filter?.yearOfStudy === "number")
        where.yearOfStudy = filter.yearOfStudy;
      if (filter?.company) where.companies = { has: filter.company };
      return prisma.user.findMany({
        where,
        take: 50,
        orderBy: { createdAt: "desc" },
      });
    },
    recommendedMentors: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const me = (await prisma.user.findUnique({
        where: { id: ctx.user.id },
      })) as any;
      if (!me) throw new Error("User not found");
      if (me.role !== "MENTEE") return [];
      const or: any[] = [];
      if (me.domain) or.push({ domain: me.domain });
      if (me.branch) or.push({ branch: me.branch });
      if (me.yearOfStudy) or.push({ yearOfStudy: me.yearOfStudy });
      if ((me.companiesInterested ?? []).length > 0) {
        or.push({ companies: { hasSome: me.companiesInterested } });
      }
      // Exclude mentors who already accepted this mentee's request
      const where: any = {
        role: "MENTOR",
        mentorRequestsReceived: {
          none: { menteeId: me.id, status: "ACCEPTED" },
        },
      } as any;
      if (or.length > 0) where.OR = or;
      return prisma.user.findMany({
        where,
        take: 20,
        orderBy: { createdAt: "desc" },
      });
    },
    myMentees: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const me = (await prisma.user.findUnique({
        where: { id: ctx.user.id },
      })) as any;
      if (!me) throw new Error("User not found");
      if (me.role !== "MENTOR") return [];
      const reqs = await (prisma as any).followRequest.findMany({
        where: { mentorId: me.id, status: "ACCEPTED" },
        include: { mentee: true },
      });
      return (reqs as any[]).map((r) => r.mentee);
    },
    myPendingRequests: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const me = (await prisma.user.findUnique({
        where: { id: ctx.user.id },
      })) as any;
      if (!me) throw new Error("User not found");
      if (me.role !== "MENTOR") return [];
      return (prisma as any).followRequest.findMany({
        where: { mentorId: me.id, status: "PENDING" },
        include: { mentor: true, mentee: true },
        orderBy: { createdAt: "desc" },
      });
    },
  },
  Mutation: {
    signup: async (_: any, { data }: any) => {
      const {
        name,
        email,
        password,
        role,
        yearOfStudy,
        domain,
        branch,
        companies,
        companiesInterested,
      } = data;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new Error("Email already in use");
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashed,
          imageUrl: "/images/placeholder-avatar.svg",
          role,
          yearOfStudy: yearOfStudy ?? null,
          domain: domain ?? null,
          branch: branch ?? null,
          companies: companies ?? [],
          companiesInterested: companiesInterested ?? [],
        } as any,
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
    sendFollowRequest: async (_: any, { mentorId }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const me = (await prisma.user.findUnique({
        where: { id: ctx.user.id },
      })) as any;
      if (!me) throw new Error("User not found");
      if (me.role !== "MENTEE")
        throw new Error("Only mentees can send requests");
      if (mentorId === me.id) throw new Error("Cannot follow yourself");
      // upsert to avoid duplicates
      await (prisma as any).followRequest.upsert({
        where: { mentorId_menteeId: { mentorId, menteeId: me.id } },
        update: { status: "PENDING" },
        create: { mentorId, menteeId: me.id, status: "PENDING" },
      });
      return true;
    },
    respondFollowRequest: async (
      _: any,
      { menteeId, action }: any,
      ctx: any
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const me = (await prisma.user.findUnique({
        where: { id: ctx.user.id },
      })) as any;
      if (!me) throw new Error("User not found");
      if (me.role !== "MENTOR") throw new Error("Only mentors can respond");
      const status = action === "ACCEPT" ? "ACCEPTED" : "REJECTED";
      await (prisma as any).followRequest.update({
        where: { mentorId_menteeId: { mentorId: me.id, menteeId } },
        data: { status },
      });
      return true;
    },
    updateProfileImage: async (_: any, { imageUrl }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const updated = await prisma.user.update({
        where: { id: ctx.user.id },
        data: { imageUrl } as any,
      });
      return updated;
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
