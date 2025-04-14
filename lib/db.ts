import { PrismaClient } from "@prisma/client"

// Check if PrismaClient is available before attempting to use it
let prisma: PrismaClient

try {
  // Create a global singleton instance of Prisma
  const globalForPrisma = global as unknown as { prisma: PrismaClient }
  
  // Initialize the PrismaClient if it doesn't exist yet
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  
  prisma = globalForPrisma.prisma
} catch (error) {
  console.error("Error initializing Prisma client:", error)
  console.warn("Please make sure you have run 'prisma generate' before starting the application")
  
  // Create a mock PrismaClient to prevent fatal crashes
  // This will allow the app to start, but DB operations will throw errors
  prisma = new Proxy({} as PrismaClient, {
    get: (target, prop) => {
      if (prop === 'then') {
        return undefined // Makes the object not thenable
      }
      return () => {
        throw new Error("Prisma client not properly initialized. Run 'prisma generate' first.")
      }
    }
  })
}

export { prisma }