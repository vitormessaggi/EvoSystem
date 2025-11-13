from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# --- Configuração Inicial do Flask e SQLAlchemy ---
app = Flask(__name__)
CORS(app) 

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///manutencao.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Modelos do Banco de Dados ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'password': self.password, # ATENÇÃO: Senha exposta para demonstração, use hashing em produção
        }

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item = db.Column(db.String(100), nullable=False)
    cliente = db.Column(db.String(100), nullable=False)
    nota_entrada = db.Column(db.String(50), nullable=False)
    nota_saida = db.Column(db.String(50), default="")
    descricao = db.Column(db.Text, nullable=False)
    om = db.Column(db.String(50), nullable=False) 
    quantidade = db.Column(db.Integer, default=1)
    status = db.Column(db.String(20), default='Em Aberto')
    data_entrada = db.Column(db.DateTime, default=datetime.utcnow)
    tecnico = db.Column(db.String(80))
    
    anotacoes = db.relationship('Annotation', backref='order', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'item': self.item,
            'cliente': self.cliente,
            'notaEntrada': self.nota_entrada,
            'notaSaida': self.nota_saida,
            'descricao': self.descricao,
            'om': self.om,
            'quantidade': self.quantidade,
            'status': self.status,
            'dataEntrada': self.data_entrada.isoformat() if self.data_entrada else None,
            'tecnico': self.tecnico,
            'anotacoes': [a.to_dict() for a in self.anotacoes]
        }

class Annotation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    texto = db.Column(db.Text, nullable=False)
    tecnico = db.Column(db.String(80))
    data = db.Column(db.DateTime, default=datetime.utcnow)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'texto': self.texto,
            'tecnico': self.tecnico,
            'data': self.data.isoformat() if self.data else None
        }

# --- Funções de Inicialização ---
def create_initial_data():
    with app.app_context():
        db.create_all()
        
        # Cria usuário admin
        if User.query.filter_by(username='admin').first() is None:
            admin_user = User(username='admin', password='123')
            db.session.add(admin_user)
            db.session.commit()
            print("Usuário 'admin' com senha '123' criado.")
        
        # Adiciona OS de teste
        if Order.query.count() == 0:
            os1 = Order(item='Máquina de Café', cliente='Cafeteria Alfa', nota_entrada='NF-9876', descricao='Vazamento', om='OM-001', quantidade=1)
            os2 = Order(item='Forno Industrial', cliente='Padaria Beta', nota_entrada='NF-8521', descricao='Fusível queimado', status='Concluído', nota_saida='NFS-456', om='OM-002', quantidade=2, tecnico='admin')
            db.session.add_all([os1, os2])
            db.session.commit()
            
            if os2.id:
                annotation = Annotation(texto="Serviço concluído e faturado.", order_id=os2.id, tecnico='admin')
                db.session.add(annotation)
                db.session.commit()
            print("Dados de teste de Ordens de Serviço adicionados.")


# --- Rotas (Endpoints) da API ---

# Rota para LISTAR TODOS OS USUÁRIOS (APENAS ADMIN)
@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    # Retorna nome de usuário e a senha (para visualização no Admin Dashboard)
    return jsonify([user.to_dict() for user in users]), 200

# Rota para Cadastro de Novos Usuários
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Nome de usuário e senha são obrigatórios.", "success": False}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Nome de usuário já existe.", "success": False}), 409

    new_user = User(username=username, password=password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": f"Usuário {username} cadastrado com sucesso.", "success": True}), 201

# Rota de Login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.password == password: 
        return jsonify({
            "message": "Login bem-sucedido!",
            "success": True,
            "user": username
        }), 200 
    else:
        return jsonify({"message": "Credenciais inválidas.", "success": False}), 401 

# Listar todas as Ordens de Serviço
@app.route('/api/orders', methods=['GET'])
def get_orders():
    orders = Order.query.all()
    return jsonify([order.to_dict() for order in orders]), 200

# Cadastrar uma nova Ordem de Serviço
@app.route('/api/orders', methods=['POST'])
def add_order():
    data = request.get_json()
    
    new_order = Order(
        item=data['item'],
        cliente=data['cliente'],
        nota_entrada=data['notaEntrada'],
        om=data['om'],
        quantidade=data['quantidade'],
        descricao=data['descricao'],
        tecnico=data.get('tecnico') 
    )

    db.session.add(new_order)
    db.session.commit()

    initial_annotation = Annotation(
        texto=f"Entrada: {data['descricao']}. NF: {data['notaEntrada']}. OM: {data['om']}.",
        order_id=new_order.id,
        tecnico=data.get('tecnico', 'Sistema')
    )
    db.session.add(initial_annotation)
    db.session.commit()

    return jsonify(new_order.to_dict()), 201 

# Rota para EXCLUIR Ordem de Serviço (NOVA ROTA ADMIN)
@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    order = Order.query.get_or_404(order_id)
    
    # O cascade="all, delete-orphan" no modelo Order garante que as Anotações sejam excluídas automaticamente.
    db.session.delete(order)
    db.session.commit()

    return jsonify({"message": f"Ordem de Serviço #{order_id} excluída com sucesso."}), 200

# Rota para Assumir o Serviço
@app.route('/api/orders/<int:order_id>/assign', methods=['PUT'])
def assign_order(order_id):
    order = Order.query.get_or_404(order_id)
    data = request.get_json()
    tecnico = data.get('tecnico')

    if order.status != 'Em Aberto':
        return jsonify({"message": f"Ordem {order_id} já está em {order.status}."}), 400

    order.status = 'Em Manutenção'
    order.tecnico = tecnico
    
    annotation = Annotation(
        texto=f"Serviço assumido pelo técnico: {tecnico}.",
        order_id=order_id,
        tecnico=tecnico
    )
    
    db.session.add(annotation)
    db.session.commit()

    return jsonify(order.to_dict()), 200

# Rota para Finalizar o Serviço
@app.route('/api/orders/<int:order_id>/finalize', methods=['PUT'])
def finalize_order(order_id):
    order = Order.query.get_or_404(order_id)
    data = request.get_json()
    nota_saida = data.get('notaSaida')
    tecnico = data.get('tecnico')
    
    order.status = 'Concluído'
    order.nota_saida = nota_saida
    
    annotation = Annotation(
        texto=f"Serviço CONCLUÍDO. NF de Saída/Faturamento: {nota_saida}.",
        order_id=order_id,
        tecnico=tecnico
    )
    
    db.session.add(annotation)
    db.session.commit()

    return jsonify(order.to_dict()), 200

# Rota para Adicionar Anotação avulsa
@app.route('/api/orders/<int:order_id>/annotate', methods=['POST'])
def add_annotation(order_id):
    order = Order.query.get_or_404(order_id)
    data = request.get_json()
    
    new_annotation = Annotation(
        texto=data['texto'],
        order_id=order_id,
        tecnico=data.get('tecnico', 'Sistema')
    )
    
    db.session.add(new_annotation)
    db.session.commit()

    return jsonify(order.to_dict()), 201


# Rota de execução principal
if __name__ == '__main__':
    create_initial_data()
    app.run(debug=True, port=5000)