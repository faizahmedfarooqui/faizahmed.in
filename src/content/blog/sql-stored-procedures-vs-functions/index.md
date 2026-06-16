---
title: "SQL - Stored Procedures vs Functions"
datePublished: Mon Sep 19 2022 12:05:41 GMT+0000 (Coordinated Universal Time)
cuid: cl88q0sj801oqv6nvdz522meo
slug: sql-stored-procedures-vs-functions
cover: ./cover.jpg
tags: postgresql, functions, stored-procedure
series: null

---

# Introduction

In this article, we're going to discuss the differences between stored procedures and functions. Before we begin comparing stored procedures with functions in SQL, I'd like to explain them briefly.

### Stored Procedures

A stored procedure is a collection of SQL statements that are stored in a database to perform some actions (business logic) or any database-related task.

Below, I've created a stored procedure with the name `GetUsers` that simply queries a `USERS` table and retrieves all users.

```SQL
DELIMITER $$

CREATE PROCEDURE `GetUsers`()

BEGIN
  SELECT * FROM USERS;
END$$

DELIMITER;
```


### Functions

Functions may take arguments, perform calculations or operations, and return the result.

**Mainly there are two types of functions:**
1. Built-in or System functions
2. User Defined functions

#### Built-in Functions

There are a lot of built-in functions available in the databases, such as `count`, `aggregate`, `date`, `string`, and so on. Some of them are listed below, along with their definitions.

```SQL
MIN()     -- Returns the minimum value

MAX()     -- Returns the maximum value

COUNT()   -- Returns the count value

SUM()     -- Returns the summation value

AVG()     -- Returns the average value
```

#### User Defined Functions

Below, I've created a user-defined function with the name `GetUserName` which takes `UserID` as a parameter and returns the user's name from a `USERS` table.

```SQL
DELIMITER $$

CREATE FUNCTION `GetUsername`(UserID int)
RETURNS varchar(32)

DETERMINISTIC

BEGIN
  DECLARE Username varchar(32);
  SELECT NAME INTO Username FROM USERS WHERE ID = UserID;
  RETURN Username;
END$$

DELIMITER;
```



# Comparing the two...
   
After gaining a basic understanding of SQL stored procedures and functions, It's time to see how the two stack up in terms of the important functionalities listed below.


### Calling 

Stored Procedures can call functions, but functions cannot call stored procedures.

```SQL
CALL GetUsers();  -- Calling a store procedure
```

Functions can be called inline from `SELECT`, `UPDATE`, `DELETE`, and `INSERT` queries, but stored procedures cannot.

```SQL
SELECT GetUsername(12);  -- Calling a user defined function with a parameter
```

### Removing 

The methods for removing stored procedures and user-defined functions are listed below.

```SQL
DROP PROCEDURE `GetUsers`;  -- Removing a stored procedure
```

```SQL
DROP FUNCTION `GetUsername`;  -- Removing a user defined function
```

### Return Values 

Stored procedures may return multiple values but functions only return a single scalar value or a table.

Functions always return a value, whereas stored procedures may or may not.

### Parameters

Stored procedures support two types of parameters: **Input and Output.**

Functions on the other hand only support input parameters.

### Restrictions

Stored procedures can modify the database by using `ALTER`, `UPDATE`, `DELETE`, etc commands.

Since functions can only use `SELECT` statements, they cannot change the database state.

### Transactions

Stored procedures allow the use of transactions, and we can write logic to roll back/commit transactions to `init`.

Functions cannot make use of transactions.

### Exception Handling

Stored procedures support try-catch blocks and exception handling can also be written in `init`.

Functions, on the other hand, do not support `init`.


# Summary

After reading this article, you will gain a good understanding of stored procedures and functions.

In addition, an example-based approach to using these highly powerful techniques is offered, along with information on when and where to apply them.

- - -
