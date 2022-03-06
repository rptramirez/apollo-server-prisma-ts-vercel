import { ApolloServer } from "apollo-server";
import { typeDefs } from "../src/schema";
import { Query, Mutation, Profile, Post, User } from "../src/resolvers";
import { PrismaClient, Prisma } from "@prisma/client";
import { getUserFromToken } from "../src/utils/getUserFromToken";

export const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient<
    Prisma.PrismaClientOptions,
    never,
    Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
  >;
  userInfo: {
    userId: number;
  } | null;
}

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers: {
    Query,
    Mutation,
    Profile,
    Post,
    User,
  },
  context: async ({ req }: any): Promise<Context> => {
    const userInfo = getUserFromToken(req.headers.authorization);

    return {
      prisma,
      userInfo,
    };
  },
  playground: true,
  introspection: true
});

apolloServer.listen().then(({ url }) => {
  console.log(`Server ready on ${url}`);
});
