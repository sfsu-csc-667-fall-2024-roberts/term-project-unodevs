import express, { Request, Response, Router } from "express";
import { createHash } from "crypto";

const router: Router = express.Router();

const handler = (req: Request, res: Response): void => {
  const { id: roomId } = req.params;
  const { message } = req.body;
  const email = req.session?.user?.email;

  if (!email || !req.session?.user?.username) {
    res.status(400).send("Invalid session data");
    return;
  }

  console.log({ email });

  const io = req.app.get("io");

  console.log({ message });
  console.log(roomId);

  //  Socket IO Event with message
  io.emit(`chat:message:${roomId === undefined ? 0 : roomId}`, {
    hash: createHash("sha256").update(email).digest("hex"),
    from: req.session.user.username,
    timestamp: Date.now(),
    message,
  });

  res.sendStatus(200);
};

router.post("/:id", handler);
router.post("/:id/chat", handler);

export default router;
