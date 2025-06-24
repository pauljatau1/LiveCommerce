module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const now = new Date();

    const users = [
      {
        name: "Alice Johnson",
        email: "alice@example.com",
        password: "$2b$10$hashedpassword1",
        companyName: "Acme Inc.",
        isAdmin: true,
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        name: "Bob Smith",
        email: "bob@example.com",
        password: "$2b$10$hashedpassword2",
        companyName: "Beta Corp.",
        isAdmin: false,
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        name: "Carla Gomez",
        email: "carla@example.com",
        password: "$2b$10$hashedpassword3",
        companyName: "Delta LLC",
        isAdmin: false,
        status: "inactive",
        created_at: now,
        updated_at: now
      },
      {
        name: "Daniel Lee",
        email: "daniel@example.com",
        password: "$2b$10$hashedpassword4",
        companyName: "Echo Co.",
        isAdmin: true,
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        name: "Eva Chen",
        email: "eva@example.com",
        password: "$2b$10$hashedpassword5",
        companyName: "Foxtrot Ltd.",
        isAdmin: false,
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        name: "Frank Moore",
        email: "frank@example.com",
        password: "$2b$10$hashedpassword6",
        companyName: "Gamma Solutions",
        isAdmin: false,
        status: "inactive",
        created_at: now,
        updated_at: now
      },
      {
        name: "Grace Park",
        email: "grace@example.com",
        password: "$2b$10$hashedpassword7",
        companyName: "Horizon Inc.",
        isAdmin: false,
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        name: "Henry Stone",
        email: "henry@example.com",
        password: "$2b$10$hashedpassword8",
        companyName: "Ignite Ltd.",
        isAdmin: true,
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        name: "Irene White",
        email: "irene@example.com",
        password: "$2b$10$hashedpassword9",
        companyName: "Jupiter Systems",
        isAdmin: false,
        status: "inactive",
        created_at: now,
        updated_at: now
      },
      {
        name: "Jack Black",
        email: "jack@example.com",
        password: "$2b$10$hashedpassword10",
        companyName: "KiloTech",
        isAdmin: false,
        status: "active",
        created_at: now,
        updated_at: now
      }
    ];

    await db.collection("users").insertMany(users);
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.collection("users").deleteMany({
      email: {
        $in: [
          "alice@example.com",
          "bob@example.com",
          "carla@example.com",
          "daniel@example.com",
          "eva@example.com",
          "frank@example.com",
          "grace@example.com",
          "henry@example.com",
          "irene@example.com",
          "jack@example.com"
        ]
      }
    });
  }
};
