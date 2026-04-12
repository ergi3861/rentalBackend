    const bcrypt = require("bcrypt");
    const jwt    = require("jsonwebtoken");
    const User   = require("../models/userModel");

    const AuthService = {

      register: async (data) => {
        const { firstName, lastName, email, password } = data;

        if (!firstName || !lastName || !email || !password) {
          throw { code: 400, message: "Të gjitha fushat janë të detyrueshme" };
        }

        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(email)) {
          throw { code: 400, message: "Email i pasaktë" };
        }

        if (password.length < 8) {
          throw { code: 400, message: "Fjalëkalimi duhet të ketë min 8 karaktere" };
        }

        const users = await User.findByEmail(email.trim().toLowerCase());
        if (users.length > 0) {
          throw { code: 400, message: "Ky email është i regjistruar tashmë" };
        }

        const hashedPassword = bcrypt.hashSync(password, 12);

        const result = await User.create({
          first_name: firstName.trim(),
          last_name:  lastName.trim(),
          email:      email.trim().toLowerCase(),
          password:   hashedPassword,
          role:       "user",
        });

        return { message: "Regjistrimi u krye me sukses!", userId: result.insertId };
      },

      login: async (data) => {
        const { email, password } = data;

        if (!email || !password) {
          throw { code: 400, message: "Email dhe fjalëkalimi kërkohen" };
        }

        const users = await User.findByEmail(email.trim().toLowerCase());
        if (users.length === 0) {
          throw { code: 401, message: "Email ose fjalëkalim i gabuar" };
        }

        const user = users[0];
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
          throw { code: 401, message: "Email ose fjalëkalim i gabuar" };
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        return {
          token,
          user: {
            id:        user.id,
            firstName: user.first_name,
            lastName:  user.last_name,
            email:     user.email,
            role:      user.role,
          },
        };
      },
    };

    module.exports = AuthService;