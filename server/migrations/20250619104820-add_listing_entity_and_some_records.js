module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const now = new Date();

    const listings = [
      {
        userId: "68510f842d568c5353a5b5c0",
        name: "Widget Pro",
        quantity: "15",
        color: "Red",
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        userId: "68510f842d568c5353a5b5c0",
        name: "Gadget Max",
        quantity: "30",
        color: "Blue",
        status: "inactive",
        created_at: now,
        updated_at: now,
      },
      {
        userId: "68510f842d568c5353a5b5c0",
        name: "Toolset Basic",
        quantity: "5",
        color: "Green",
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        userId: "68510f842d568c5353a5b5c0",
        name: "Device Plus",
        quantity: "20",
        color: "Yellow",
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        userId: "68510f842d568c5353a5b5c0",
        name: "Gear Set",
        quantity: "10",
        color: "Black",
        status: "inactive",
        created_at: now,
        updated_at: now,
      },
      {
        userId: "68510f842d568c5353a5b5c0",
        name: "Accessory Kit",
        quantity: "12",
        color: "White",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        userId: "68510f842d568c5353a5b5c0",
        name: "Gizmo Lite",
        quantity: "8",
        color: "Purple",
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        userId: "68510f842d568c5353a5b5c0",
        name: "Component X",
        quantity: "25",
        color: "Orange",
        status: "inactive",
        created_at: now,
        updated_at: now,
      },
      {
        userId: "68510f842d568c5353a5b5c0",
        name: "Module Prime",
        quantity: "40",
        color: "Silver",
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        userId: "68510f842d568c5353a5b5c0",
        name: "Part Alpha",
        quantity: "18",
        color: "Gold",
        status: "active",
        created_at: now,
        updated_at: now
      },
    ];

    await db.collection("listings").insertMany(listings);
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
