import dataSource from "../../../db/data-source";
import { User } from "../entities/user.entity";
import * as bcrypt from "bcrypt";

const users = [
    { firstName: "Nipun", lastName: "Chamika", email: "nipun.c@softcodeit.com", password: "password"}
];

async function seedUsers() {
    await dataSource.initialize();
    const userRepository = dataSource.getRepository(User);

    for (const user of users) {
        // Hash the password before inserting
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await userRepository.save({
            ...user,
            password: hashedPassword
        });
    }
    await dataSource.destroy();
}

seedUsers().catch(error => {
    console.error("Seeding failed", error);
    process.exit(1);
})