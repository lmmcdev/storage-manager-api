import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  UserCredentials,
  UserRegistration,
  UserRole,
} from '../interfaces/auth.interface';

export class UserService {
  private readonly users: Map<string, User & { passwordHash: string }> = new Map();
  private readonly usersByEmail: Map<string, string> = new Map();
  private readonly saltRounds = 12;

  constructor() {
    this.seedDefaultUsers();
  }

  async createUser(userData: UserRegistration): Promise<User> {
    if (this.usersByEmail.has(userData.email.toLowerCase())) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(userData.password, this.saltRounds);
    const userId = uuidv4();

    const user: User & { passwordHash: string } = {
      id: userId,
      email: userData.email.toLowerCase(),
      name: userData.name,
      role: userData.role || UserRole.USER,
      isActive: true,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(userId, user);
    this.usersByEmail.set(user.email, userId);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async authenticateUser(credentials: UserCredentials): Promise<User | null> {
    const userId = this.usersByEmail.get(credentials.email.toLowerCase());
    if (!userId) {
      return null;
    }

    const user = this.users.get(userId);
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = this.usersByEmail.get(email.toLowerCase());
    if (!userId) {
      return null;
    }

    return this.getUserById(userId);
  }

  async updateUser(
    userId: string,
    updates: Partial<Pick<User, 'name' | 'role' | 'isActive'>>
  ): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    if (updates.name !== undefined) {
      user.name = updates.name;
    }
    if (updates.role !== undefined) {
      user.role = updates.role;
    }
    if (updates.isActive !== undefined) {
      user.isActive = updates.isActive;
    }

    user.updatedAt = new Date();
    this.users.set(userId, user);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      return false;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);
    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date();

    this.users.set(userId, user);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    const users: User[] = [];
    for (const user of this.users.values()) {
      const { passwordHash: _, ...userWithoutPassword } = user;
      users.push(userWithoutPassword);
    }
    return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    this.users.delete(userId);
    this.usersByEmail.delete(user.email);
    return true;
  }

  private async seedDefaultUsers(): Promise<void> {
    try {
      const adminUser = await this.createUser({
        email: 'admin@example.com',
        password: 'Admin123!',
        name: 'Administrator',
        role: UserRole.ADMIN,
      });

      const testUser = await this.createUser({
        email: 'user@example.com',
        password: 'User123!',
        name: 'Test User',
        role: UserRole.USER,
      });

      console.log('Default users created:', {
        admin: { email: adminUser.email, role: adminUser.role },
        user: { email: testUser.email, role: testUser.role },
      });
    } catch (error) {
      console.error('Failed to seed default users:', error);
    }
  }
}