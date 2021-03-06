var Schema = {
  users: {
    id: {type: 'increments', nullable: false, primary: true},
    email: {type: 'string', maxlength: 254, nullable: false, unique: true},
    name: {type: 'string', maxlength: 150, nullable: false},
    password: {type: 'string', maxlength: 150, nullable: false},
    extra_token: {type: 'string', maxlength: 150, nullable: true},
    server_url: {type: 'string', maxlength: 150, nullable: true},
    image: {type: 'string', maxlength: 150, nullable: true},
    permission: {type: 'string', maxlength: 150, nullable: true}
  },
  pi: {
    id: {type: 'increments', nullable: false, primary: true},
    serial_number: {type: 'string', maxlength: 150, nullable: false, unique: true},
    user_id: {type: 'integer', nullable: false, unsigned: true},
  },
  categories: {
    id: {type: 'increments', nullable: false, primary: true},
    name: {type: 'string', maxlength: 150, nullable: false}
  },
  posts: {
    id: {type: 'increments', nullable: false, primary: true},
    user_id: {type: 'integer', nullable: false, unsigned: true},
    category_id: {type: 'integer', nullable: false, unsigned: true},
    title: {type: 'string', maxlength: 150, nullable: false},
    slug: {type: 'string', maxlength: 150, nullable: false, unique: true},
    html: {type: 'text', maxlength: 16777215, fieldtype: 'medium', nullable: false},
    created_at: {type: 'dateTime', nullable: false},
    updated_at: {type: 'dateTime', nullable: true}
  },
  tags: {
    id: {type: 'increments', nullable: false, primary: true},
    slug: {type: 'string', maxlength: 150, nullable: false, unique: true},
    name: {type: 'string', maxlength: 150, nullable: false}
  },
  posts_tags: {
    id: {type: 'increments', nullable: false, primary: true},
    post_id: {type: 'integer', nullable: false, unsigned: true},
    tag_id: {type: 'integer', nullable: false, unsigned: true}
  }
};
module.exports = Schema;