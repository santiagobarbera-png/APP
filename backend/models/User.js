class User {
    constructor(pool) {
        this.pool = pool;
    }

    async save(userData) {
        const { name, email } = userData;
        const query = 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *';
        const values = [name, email];

        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const values = [id];

        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const values = [email];

        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    async findAll() {
        const query = 'SELECT * FROM users';

        const res = await this.pool.query(query);
        return res.rows;
    }

    async update(id, userData) {
        const { name, email } = userData;
        const query = 'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *';
        const values = [name, email, id];

        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    async delete(id) {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
        const values = [id];

        const res = await this.pool.query(query, values);
        return res.rows[0];
    }
}

module.exports = User;