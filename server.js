import mysql from 'mysql2/promise'
import express from 'express'
const app = express()
app.use(express.json())
const port = 3000

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Re08012006@',
    database: 'BancoSQL',
    port: 3306 
};

app.get('/usuarios', async(req, res) => {
    try {
    const connection = await mysql.createConnection(dbConfig)

    const [rows] = await connection.execute(`
        SELECT 
        u.id AS usuarioID,
        u.nome,
        u.email,
        c.id AS cargoID,
        c.permissoes
        FROM usuario u LEFT JOIN cargo c ON u.id = c.usuario_id
        `);

        await connection.end()

        const usersMap = {}
        rows.forEach(row => {
            if (!usersMap[row.usuarioID]) {
                usersMap[row.usuarioID] = {
                    id: row.usuarioID,
                    nome: row.nome,
                    email: row.email,
                    cargos: []
                };
            }
            if (row.cargoID) {
                usersMap[row.usuarioID].cargos.push({
                    id: row.cargoID,
                    permissoes: row.permissoes
                });
            }
        });

        res.json(Object.values(usersMap))

    } catch (error) {
        console.error('Erro ao processar requisição', error.message)
        res.status(500).json({ error: 'Erro ao acessar o banco de dados'})
    }
});
app.put('/usuarios/:id', async(req, res) =>{
    try {
        const {id} = req.params
        const {nome} = req.body
        const {email} = req.body
        console.log('valores', id, nome, email)
        if (!nome && !email) {
            return res.status(400).json({
                error: 'Os campos "nome" e "email" são obrigatórios.'
            });
        }

        const connection = await mysql.createConnection(dbConfig)

        const [result] = await connection.execute(
            'UPDATE usuario SET nome = ?, email = ? WHERE id = ?',[nome, email, id]
        );

        await connection.end()

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Usuário não encontrado.'
            });
        }

        res.json({ message: 'Usuário atualizado com sucesso.', updatedID: id})
    }

    catch (error) {
        console.error('Erro ao atualizar usuário:', error)
        res.status(500).json({ error: 'Erro ao atualizar usuário.' })
    }
});

app.post('/usuarios', async (req, res) => {
    try {
        const { nome } = req.body;
        const { email } = req.body;
        if (!nome || !email) {
            return res.status(400).json({ error: 'Os campos "nome" e "email" são obrigatórios.' });
        }
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO usuario (nome, email) VALUES (?, ?)',
            [nome, email]
        );
        await connection.end();
        res.status(201).json({ id: result.insertId, nome, email, message: 'Usuário criado com sucesso.' });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
});
app.post('/usuarios', async (req, res) => {
    try {
        const {permissoes} = req.body;
        if (!permissoes) {
            return res.status(400).json({ error: 'O campo permissão é obrigatório.' })
        }
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO cargos (permissoes) VALUES (?)',
            [permissoes]
        );
        await connection.end();
        res.status(201).json({ id: result.insertId, permissoes, message: 'Permissão criada com sucesso.'})
    } catch (error) {
        console.error('Erro ao criar permissão: ', error);
        res.status(500).json({ error: 'Erro ao criar permissão.'});
    }
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})