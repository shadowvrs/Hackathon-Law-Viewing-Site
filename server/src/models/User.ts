import { DataTypes, Model, Optional } from 'sequelize';
import db from '../database/index.js';

// All fields on the stored row
interface UserAttributes {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// Fields that have defaults and don't need to be supplied on creation
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare createdAt: string;
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => `usr_${Date.now()}`,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: () => new Date().toISOString(),
    },
  },
  {
    sequelize: db,
    tableName: 'users',
    // We manage createdAt as a plain string to match the shared User type
    timestamps: false,
  }
);

export default User;
