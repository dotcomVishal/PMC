export default function Footer() {
  return (
    <footer className="bg-background pt-24 pb-12 px-6 md:px-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <h2 className="text-4xl font-display mb-6 text-white uppercase tracking-widest">PMC IIT Mandi</h2>
            <p className="text-secondary max-w-sm">
              Photography and Movie Making Club.<br/>
              Capturing moments, telling stories.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-6 uppercase tracking-wider text-sm">Address</h4>
            <address className="text-secondary not-italic text-sm leading-relaxed">
              Indian Institute of Technology Mandi<br/>
              Kamand, Himachal Pradesh<br/>
              175005, India
            </address>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6 uppercase tracking-wider text-sm">Socials</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-secondary hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="text-secondary hover:text-white transition-colors">YouTube</a></li>
              <li><a href="#" className="text-secondary hover:text-white transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-secondary gap-4">
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-white text-xl font-display">50+</span>
              <span className="text-xs uppercase tracking-widest">Members</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-xl font-display">2</span>
              <span className="text-xs uppercase tracking-widest">Divisions</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-xl font-display">12+</span>
              <span className="text-xs uppercase tracking-widest">Awards</span>
            </div>
          </div>
          
          <p>&copy; {new Date().getFullYear()} PMC IIT Mandi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
