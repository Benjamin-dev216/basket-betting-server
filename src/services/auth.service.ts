/** @format */

import { UserEntity } from "../entities";
import { AppDataSource } from "../setup/datasource";
import { CreateUserRequestType } from "../types";

export const createUser = async ({
  email,
  password,
}: CreateUserRequestType): Promise<UserEntity | null> => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  const existingUser = await userRepository.findOne({ where: { email } });
  if (existingUser) {
    return null;
  }

  const newUser = new UserEntity();
  Object.assign(newUser, { email, password });

  return await userRepository.save(newUser);
};

export const getUser = async ({ email }): Promise<UserEntity | null> => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  const gettingUser: UserEntity | null = await userRepository.findOne({
    where: { email },
  });
  if (gettingUser) return gettingUser;
  return null;
};
