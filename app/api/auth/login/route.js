import { prisma, bcrypt } from "../../../../lib/db.js";
import { setSessionCookie } from "../../../../lib/auth.js";

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return Response.json({ error: "Username and password required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return Response.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Invalid username or password." }, { status: 401 });
  }

  setSessionCookie(user.id);

  return Response.json({ id: user.id, username: user.username });
}

