const fs = require('fs');
const mysql = require('mysql');
const multer = require('multer');
const express = require('express');
const session = require('express-session')
const bodyParser = require('body-parser');
const passwordHash = require('password-hash');
const upload = multer({dest: './public/img/tmp'});

const app = express();
const urlParse = bodyParser.urlencoded({extended: false});

app.use(express.static('public'));

app.use(session({
	secret: 'SchoolAdmin',
	resave: true,
	saveUninitialized: true
}));

// create connection
const con = mysql.createConnection(
    {   // connection details
        host: 'localhost',
        user: 'root',
        password: '12345',
        database: 'school_db',
        multipleStatements: true
    }
);

// connect
con.connect(function(err) {
	if (err) throw err;
	console.log("Connected!");
});

app.post('/login', urlParse, function (req, res) {
    if (!req.body) 
		return res.sendStatus(400);
        
    //console.log(req.body);    
    var username = req.body.username;
    var password = req.body.password;
    //var {username, password} = req.body;
    //console.log("Login attempt received:" + username + "," + password);

    con.query(
        `SELECT admins.name as name, admins.email as email, admins.password as password, admins.image as image, roles.name as role FROM admins INNER JOIN roles on roles.id = admins.role_id WHERE email=?`, [username], 
        function (error, results) {
            if (error) {
                console.log("error ocurred", error);
                res.send({
                    "code":400,
                    "failed":"error ocurred!"
                })
            } else {
                //console.log('The solution is: ', results);
                if (results.length > 0) {
                    //if (results[0].password == password) {
					if (passwordHash.verify(password, results[0].password)) {
                        req.session.role = results[0].role;
                        res.send({
                            "code":200,
                            "success":"login sucessfull",
                            "data": results
                        });
                    } else{
                        res.send({
                            "code":204,
                            "success":"Email and password does not match!"
                        });
                    }
                } else{
                    res.send({
                        "code":204,
                        "success":"Email does not exits!"
                    });
                }
            }
        });
});

app.get('/logout', urlParse, function (req, res) {
    //console.log("logout...");
    req.session.destroy();
    res.sendStatus(200);
    /*res.send({
        "code":200,
        "success":"logout sucessfull"
    });*/
});

app.get('/courses', urlParse, function (req, res) {
    QuerySQL(`SELECT * FROM courses`, [], res);
});

app.get('/students', urlParse, function (req, res) {
    QuerySQL(`SELECT * FROM students`, [], res);
});

app.get('/roles', urlParse, function (req, res) {
	QuerySQL(`SELECT * FROM roles`, [], res);
});

app.get('/admins', urlParse, function (req, res) {
    QuerySQL(`SELECT admins.id as id, admins.name as name, admins.phone as phone, 
    admins.email as email, admins.image as image, admins.role_id as role_id, 
    roles.name as role FROM admins INNER JOIN roles on roles.id = admins.role_id`, [], res);
});

app.get('/course/:id', urlParse, function (req, res) {
    QuerySQL(`SELECT name, description, image FROM courses WHERE id=?; SELECT name FROM students WHERE course_id=?`, [req.params['id'], req.params['id']], res);
});

app.get('/student/:id', urlParse, function (req, res) {
    QuerySQL(`SELECT students.name as name, students.phone as phone, students.email as email, students.image as image, students.course_id as course_id, courses.name as course_name 
    FROM students INNER JOIN courses on students.course_id = courses.id WHERE students.id=?`, [req.params['id']], res);
});

app.get('/admin/:id', urlParse, function (req, res) {
    QuerySQL(`SELECT admins.name as name, admins.phone as phone, admins.email as email, admins.image as image,
    admins.password as password, admins.role_id as role_id, roles.name as role_name FROM admins INNER JOIN roles on roles.id = admins.role_id WHERE admins.id=?;
    SELECT * FROM roles`, [req.params['id']], res);
});

app.post('/upload/:type', upload.single('img'), function (req, res) {
	if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png') {
		fs.rename(req.file.path, 'public/img/' + req.params['type'] + '/' + req.file.originalname, function (err) {
			if (err) {throw new Error(err);}
			res.send('<h1>uploaded successfully</h1>');
		})
	} else {
		fs.unlink(req.file.path, function (err) {
			if (err) {throw new Error(err);}
			res.send('<h1>it\'s not correct mimetype</h1>');
		});
	}
});

app.post('/addCourse', urlParse, function (req, res) {
    if (!req.body) 
        return res.sendStatus(400);
        
    QuerySQL(`INSERT INTO courses (name, description, image) VALUES (?, ?, ?)`, [req.body.name, req.body.description, req.body.image], res);
});

app.post('/editCourse', urlParse, function (req, res) {
    if (!req.body) 
        return res.sendStatus(400);
        
    QuerySQL(`UPDATE courses SET name=?, description=?, image=? WHERE id=?`, [req.body.name, req.body.description, req.body.image, req.body.course_id], res);
});

app.post('/deleteCourse', urlParse, function (req, res) {
    if (!req.body) 
        return res.sendStatus(400);
        
    QuerySQL(`DELETE FROM courses WHERE id=?`, [req.body.course_id], res);
});

app.post('/addStudent', urlParse, function (req, res) {
    if (!req.body) 
        return res.sendStatus(400);
        
    QuerySQL(`INSERT INTO students (name, phone, email, image, course_id) VALUES (?, ?, ?, ?, ?)`, [req.body.name, req.body.phone, req.body.email, req.body.image, req.body.course_id], res);
});

app.post('/editStudent', urlParse, function (req, res) {
    if (!req.body) 
        return res.sendStatus(400);
        
    QuerySQL(`UPDATE students SET name=?, phone=?, email=?, image=?, course_id=? WHERE id=?`, [req.body.name, req.body.phone, req.body.email, req.body.image, req.body.course_id, req.body.student_id], res);
});

app.post('/deleteStudent', urlParse, function (req, res) {
    if (!req.body) 
        return res.sendStatus(400);
        
    QuerySQL(`DELETE FROM students WHERE id=?`, [req.body.student_id], res);
});

app.post('/addAdmin', urlParse, function (req, res) {
    if (!req.body) 
        return res.sendStatus(400);
        
    QuerySQL(`INSERT INTO admins (name, phone, email, image, role_id, password) VALUES (?, ?, ?, ?, ?, ?)`, [req.body.name, req.body.phone, req.body.email, req.body.image, req.body.role_id, passwordHash.generate(req.body.password)], res);
});

app.post('/editAdmin', urlParse, function (req, res) {
    if (!req.body) 
        return res.sendStatus(400);

    con.query(
        `SELECT password FROM admins WHERE id=?`, [req.body.admin_id], 
        function (error, results) {
            if (error) {
                console.log("error ocurred", error);
                res.send({
                    "code":400,
                    "failed":"error ocurred!"
                })
            } else {
                var password;
                if (results[0].password === req.body.password)
                    password = req.body.password; // password wasn't changed
                else
                    password = passwordHash.generate(req.body.password); // password was changed
                QuerySQL(`UPDATE admins SET name=?, phone=?, email=?, password=?, role_id=?, image=? WHERE id=?`, [req.body.name, req.body.phone, req.body.email, password, req.body.role_id, req.body.image, req.body.admin_id], res);
            
            }
        });
});

app.post('/deleteAdmin', urlParse, function (req, res) {
    if (!req.body) 
        return res.sendStatus(400);
        
    QuerySQL(`DELETE FROM admins WHERE id=?`, [req.body.admin_id], res);
});

function QuerySQL(query, params, res) {
    //console.log(query);
    //console.log(params);
    con.query(
        query, params,
        function (error, results) {
            if (error) {
                console.log("error ocurred", error);
                res.send({
                    "code":400,
                    "failed":"error ocurred!"
                })
            } else {
				//console.log(results);
                res.send(results);
            }
        });
}

var port = 3000;
app.listen(port, function () {
	console.log('Server listening on port ' + port);
});
