// One-off CLI script to promote an existing account to admin.
//
// There's no in-app way to do this, on purpose:
//   - The admin panel needs a first admin to exist before anyone could use
//     it to grant the role to themselves — a chicken-and-egg problem any
//     in-app "become admin" button can't solve safely.
//   - Letting a logged-in admin mint more admins over the API is a bigger
//     privilege-escalation surface (one compromised admin session -> can
//     create infinite admins) than this project needs. A local script that
//     only you can run, against credentials only you have, is the smaller
//     and simpler attack surface.
//
// Usage (from server/, with your real .env in place):
//   node scripts/setAdmin.js you@example.com
import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../src/models/User.js'

const email = process.argv[2]

async function main() {
  if (!email) {
    console.error('Usage: node scripts/setAdmin.js <email>')
    process.exit(1)
  }
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set — check server/.env')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { isAdmin: true },
    { new: true },
  )

  if (!user) {
    console.error(`No user found with email ${email} — sign up/log in with that account first, then rerun this.`)
    await mongoose.disconnect()
    process.exit(1)
  }

  console.log(`${user.email} is now an admin. Refresh the client (it re-verifies the session on load) to see the Admin button.`)
  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
