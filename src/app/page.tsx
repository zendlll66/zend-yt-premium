import React from 'react'

const page = () => {
  return (
    <div>
      <h1>Hello World</h1>
      <p>This is a test page</p>
      <button>Click me</button>
      <input type="text" placeholder="Enter your name" />
      <select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </select>


    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Age</th>
          <th>Email</th>
        </tr>
      </thead>
    </table>


    <form>
      <input type="text" placeholder="Enter your name" />
      <input type="text" placeholder="Enter your age" />
      <input type="text" placeholder="Enter your email" />
      <button>Submit</button>
    </form>


    <h2>ทดสอบข้อความภาษาไทย</h2>
    <p>ทดสอบข้อความภาษาไทย</p>
    <p>ทดสอบข้อความภาษาไทย</p>
    </div>
  )
}

export default page