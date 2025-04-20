import { UserEntity } from "@/entities";
import { AppDataSource } from "@/setup/datasource";

export const findByEmail = async (
  email: string
): Promise<UserEntity | null> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  return await userRepository.findOne({ where: { email } });
};

export const updateUserBalance = async (
  email: string,
  amount: number
): Promise<UserEntity> => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  const user = await findByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  user.balance += amount;
  return await userRepository.save(user);
};

export const setUserBalance = async (
  email: string,
  newBalance: number
): Promise<UserEntity> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const user = await findByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  user.balance = newBalance;
  return await userRepository.save(user);
};

export const getAllUsers = async (): Promise<UserEntity[]> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  return await userRepository.find();
};
