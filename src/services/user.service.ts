import { UserEntity } from "../entities";
import { AppDataSource } from "../setup/datasource";

export const findByEmail = async (
  email: string
): Promise<UserEntity | null> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  return await userRepository.findOne({ where: { email } });
};

export const addUserBalance = async (
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

export const deleteUser = async (id: string): Promise<void> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  await userRepository.delete(id);
};
export const updateUser = async (id: string, user: any): Promise<void> => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  const rlt = await userRepository.findOne({ where: { id: id } });

  if (!rlt) throw new Error("User not found");

  rlt.email = user.email;
  rlt.balance = user.balance;
  rlt.role = user.role;
  rlt.pendingTime1 = user.pendingTime1;
  rlt.pendingTime2 = user.pendingTime2;

  await userRepository.save(rlt);
};
