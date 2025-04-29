// src/types/express/index.d.ts
import { UserEntity } from "../../entities/user.entity";

declare global {
  namespace Express {
    interface Request {
      user?: UserEntity;
    }
  }
}
