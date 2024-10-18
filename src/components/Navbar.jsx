const Navbar = () => (
  <header className="bg-white p-4 flex justify-between items-center">
    <div className="flex items-center space-x-4">
      <img
        src="/emblem.svg"
        alt="Government of India Emblem"
        className="h-12"
      />
      <div>
        <h1 className="text-xl font-bold">
          Ministry of Road Transport and Highways
        </h1>
        <h2 className="text-lg">सड़क परिवहन और राजमार्ग मंत्रालय</h2>
      </div>
    </div>
    <nav className="flex space-x-4">
      <a href="#" className="text-blue-600">
        Home
      </a>
      <a href="#" className="text-blue-600">
        Review
      </a>
      <a href="#" className="text-blue-600">
        Contacts
      </a>
      <a href="#" className="text-blue-600">
        About
      </a>
      <a href="#" className="text-blue-600">
        Login/Sign up
      </a>
    </nav>
  </header>
);

export default Navbar;
